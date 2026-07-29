// Push notification registration.
//
// ⚠️ The `device_push_tokens` table this writes to is **B2 — an unapproved schema
// change**. Until that migration lands, `registerPushToken` fails and
// `usePushRegistration` reports `unavailable`; nothing else in the app is
// affected. The client half is complete and correct against the drafted schema
// (plan §10), so enabling push is a migration away, not a rewrite.

import Constants, { AppOwnership } from "expo-constants"
import * as Device from "expo-device"
import { Platform } from "react-native"

import { PORTAL } from "@/lib/constants"
// Lazy accessor, never a direct import: on Expo Go the module throws while being
// evaluated, which would take down every route above this file. See pushModule.ts.
import { hasNotificationsModule, loadNotifications } from "@/lib/pushModule"
import { supabase } from "@/lib/supabase/client"

export const ANDROID_CHANNEL_ID = "bookings"

export type PushPermission = "granted" | "denied" | "undetermined"

// Android 13+ requires the channel to exist BEFORE the permission prompt, or the
// prompt misbehaves. Creating it is cheap and idempotent, so it runs on every
// registration attempt rather than being tracked as state.
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return
  const Notifications = loadNotifications()
  if (!Notifications) return

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Bookings and alerts",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  })
}

export async function getPermissionStatus(): Promise<PushPermission> {
  const Notifications = loadNotifications()
  if (!Notifications) return "undetermined"

  const { status } = await Notifications.getPermissionsAsync()
  if (status === "granted") return "granted"
  if (status === "denied") return "denied"
  return "undetermined"
}

export async function requestPermission(): Promise<PushPermission> {
  const Notifications = loadNotifications()
  if (!Notifications) return "undetermined"

  await ensureAndroidChannel()
  const { status } = await Notifications.requestPermissionsAsync()
  if (status === "granted") return "granted"
  return status === "denied" ? "denied" : "undetermined"
}

// Expo Go removed push support in SDK 53. Calling `getExpoPushTokenAsync` there
// throws, which surfaces as a red-box error on every launch — so it is detected
// and skipped rather than caught after the fact.
//
// `Constants.appOwnership === "expo"` is deprecated in favour of
// `executionEnvironment`, but that replacement reports `storeClient` for BOTH
// Expo Go and a dev client, which is precisely the distinction needed here. The
// deprecated field is the only one that answers the question.
export function isExpoGo(): boolean {
  return Constants.appOwnership === AppOwnership.Expo
}

// Push needs a real device AND a build that supports it. Simulators cannot
// produce a token, Expo Go cannot receive push, and a client where the native
// module failed to load cannot do either.
export function canReceivePush(): boolean {
  return Device.isDevice && !isExpoGo() && hasNotificationsModule()
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!canReceivePush()) return null

  const Notifications = loadNotifications()
  if (!Notifications) return null

  // Reads from `app.json`'s extra.eas.projectId. Passing it explicitly is the
  // documented recommendation — the implicit lookup breaks in bare/EAS contexts.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId

  if (!projectId) return null

  // Belt and braces: `canReceivePush()` should already have excluded every
  // environment that throws here, but an unhandled rejection in this path would
  // red-box the whole app on launch, which is far worse than no push.
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
    return data ?? null
  } catch {
    return null
  }
}

export async function registerPushToken(token: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Upsert on `token`: reinstalling or restoring a backup can hand the same token
  // to a different user, and one row per token is what keeps a notification from
  // being delivered to whoever held it previously.
  const { error } = await supabase.from("device_push_tokens").upsert(
    {
      user_id: user.id,
      token,
      platform: Platform.OS === "ios" ? "ios" : "android",
      portal: PORTAL,
      device_name: Device.deviceName ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  )

  if (error) throw error
}

// Called on sign-out. Leaving the row behind would send this vendor's booking
// alerts to a phone that is no longer signed in — a real data leak, not just
// noise.
export async function unregisterPushToken(token: string): Promise<void> {
  await supabase.from("device_push_tokens").delete().eq("token", token)
}
