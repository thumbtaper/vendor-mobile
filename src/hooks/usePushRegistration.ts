import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"

// TYPE-ONLY import — erased at compile time, emits no require. A value import of
// `expo-notifications` here throws during module evaluation on Expo Go and takes
// PushProvider and (app)/_layout.tsx down with it. See lib/pushModule.ts.
import type * as NotificationsTypes from "expo-notifications"

import { routeForPayload, type PushPayload } from "@/lib/notifications"
import { loadNotifications } from "@/lib/pushModule"
import {
  canReceivePush,
  getExpoPushToken,
  getPermissionStatus,
  registerPushToken,
  requestPermission,
  unregisterPushToken,
  type PushPermission,
} from "@/services/push.service"
import { unreadCountQueryKey } from "./useNotificationsQuery"

export type PushState =
  | "checking"
  | "unsupported" // simulator, or no EAS project id
  | "undetermined"
  | "denied"
  | "granted"
  | "unavailable" // token store rejected the write — see B2

export function usePushRegistration(hasSession: boolean) {
  const router = useRouter()
  const queryClient = useQueryClient()
  // `canReceivePush()` is a synchronous device check, so the unsupported case is
  // known at first render rather than after an effect.
  const [state, setState] = useState<PushState>(() =>
    canReceivePush() ? "checking" : "unsupported",
  )
  const tokenRef = useRef<string | null>(null)

  const register = useCallback(async () => {
    const token = await getExpoPushToken()
    if (!token) {
      setState("unsupported")
      return
    }
    tokenRef.current = token
    try {
      await registerPushToken(token)
      setState("granted")
    } catch {
      // The device is willing and permitted; the backend has nowhere to put the
      // token yet (B2). Reported distinctly so it is not mistaken for the user
      // having declined.
      setState("unavailable")
    }
  }, [])

  // Reset during render on a session change, not in an effect — the same pattern
  // as `useVendorGate`. Resetting in an effect would leave the previous user's
  // push state visible for a frame after an account switch.
  const [prevHasSession, setPrevHasSession] = useState(hasSession)
  if (prevHasSession !== hasSession) {
    setPrevHasSession(hasSession)
    setState(canReceivePush() ? "checking" : "unsupported")
  }

  useEffect(() => {
    if (!hasSession || !canReceivePush()) {
      // Refs cannot be touched during render, so the stale token from a previous
      // session is cleared here instead.
      tokenRef.current = null
      return
    }

    let cancelled = false
    getPermissionStatus().then((permission: PushPermission) => {
      if (cancelled) return
      if (permission === "granted") register()
      else setState(permission)
    })

    return () => {
      cancelled = true
    }
  }, [hasSession, register])

  // Permission is requested only when the vendor asks for it — never on first
  // launch. A cold prompt is the fastest way to a permanent "Don't allow", which
  // on iOS cannot be re-asked from inside the app.
  const enable = useCallback(async () => {
    const permission = await requestPermission()
    if (permission === "granted") await register()
    else setState(permission)
  }, [register])

  const disable = useCallback(async () => {
    if (tokenRef.current) await unregisterPushToken(tokenRef.current)
    tokenRef.current = null
    setState("undetermined")
  }, [])

  // Taps route to the booking the notification is about. Handles both a warm app
  // and a cold start, where the response arrived before this listener existed.
  useEffect(() => {
    // `canReceivePush()` gates this as well as registration: where push cannot
    // arrive (Expo Go, simulators) these listeners have nothing to listen for,
    // and on a client without the native module they throw — at mount, after
    // sign-in, which reads as a random crash rather than a missing feature.
    if (!hasSession || !canReceivePush()) return

    const Notifications = loadNotifications()
    if (!Notifications) return

    const handle = (response: NotificationsTypes.NotificationResponse) => {
      const payload = response.notification.request.content.data as
        | PushPayload
        | undefined
      queryClient.invalidateQueries({ queryKey: unreadCountQueryKey })
      const route = routeForPayload(payload)
      if (route) router.push(route as never)
    }

    try {
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) handle(response)
        })
        .catch(() => {})

      const sub = Notifications.addNotificationResponseReceivedListener(handle)
      return () => sub.remove()
    } catch (error) {
      console.warn("[push] response listener unavailable:", error)
    }
  }, [hasSession, router, queryClient])

  // A push arriving in the foreground must refresh the badge and the list, or the
  // banner and the app disagree about what is unread.
  useEffect(() => {
    if (!canReceivePush()) return

    const Notifications = loadNotifications()
    if (!Notifications) return

    try {
      const sub = Notifications.addNotificationReceivedListener(() => {
        queryClient.invalidateQueries({ queryKey: unreadCountQueryKey })
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
      })
      return () => sub.remove()
    } catch (error) {
      console.warn("[push] foreground listener unavailable:", error)
    }
  }, [queryClient])

  return { state, enable, disable }
}
