// The single place that knows `expo-notifications` may not exist.
//
// WHY THIS FILE EXISTS — the failure it prevents:
//   On Android in Expo Go, `import * as Notifications from "expo-notifications"`
//   THROWS WHILE THE MODULE IS EVALUATED. Push (remote notifications) was removed
//   from Expo Go in SDK 53, and the module raises on load rather than on use.
//
//   A top-level import therefore poisons the whole module graph above it:
//   usePushRegistration → PushProvider → (app)/_layout.tsx all fail to evaluate,
//   expo-router then sees route modules with no default export, and the app dies
//   with `Cannot read property 'ErrorBoundary' of undefined`. Guarding the CALLS
//   does nothing — the module never gets far enough to run them.
//
//   So the import must be lazy, and it must live behind one accessor rather than
//   being repeated at each call site.
//
// `import type` below is erased at compile time and emits no require, so the
// types stay fully checked without loading anything.

import type * as NotificationsModule from "expo-notifications"

export type NotificationsApi = typeof NotificationsModule

// `undefined` = not attempted yet; `null` = attempted and unavailable. The
// distinction keeps a failed load from being retried on every render.
let cached: NotificationsApi | null | undefined

export function loadNotifications(): NotificationsApi | null {
  if (cached !== undefined) return cached

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require("expo-notifications") as NotificationsApi
  } catch (error) {
    console.warn(
      "[push] expo-notifications is unavailable on this client " +
        "(expected in Expo Go — push needs a development build):",
      error,
    )
    cached = null
  }

  return cached
}

/** True when the native module loaded — i.e. this client can do notifications at all. */
export function hasNotificationsModule(): boolean {
  return loadNotifications() !== null
}
