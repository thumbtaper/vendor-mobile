import { loadNotifications } from "./pushModule"

// How an arriving push behaves while the app is in the foreground.
//
// SDK 57 note: `shouldShowAlert` is deprecated and replaced by the explicit
// `shouldShowBanner` / `shouldShowList` pair — banner is the heads-up display,
// list is the notification centre entry. Pre-SDK-53 examples still use the old
// field and silently do nothing.
//
// Registered through the lazy accessor: a direct import here would throw during
// module evaluation on Expo Go and take the root layout down with it, since this
// file is imported at the top of `app/_layout.tsx`. See `pushModule.ts`.
export function registerForegroundNotificationHandler(): void {
  const Notifications = loadNotifications()
  if (!Notifications) return

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: true,
        // A banner is shown even in the foreground: this app's whole point is
        // that a booking needing approval reaches the vendor immediately, and
        // suppressing it while they happen to have the app open is the wrong
        // default here.
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })
  } catch (error) {
    console.warn("[notifications] foreground handler unavailable:", error)
  }
}

export interface PushPayload {
  type?: string
  booking_id?: string
}

// Where a tapped notification should land. Returns null when the payload carries
// nothing routable, in which case the app just opens where it was.
export function routeForPayload(payload: PushPayload | undefined): string | null {
  if (!payload) return null
  if (payload.booking_id) return `/bookings/${payload.booking_id}`
  if (payload.type) return "/notifications"
  return null
}
