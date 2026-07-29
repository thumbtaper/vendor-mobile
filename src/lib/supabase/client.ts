// Hermes ships an incomplete `URL`, which realtime-js needs. This import must run
// before the client is constructed, not merely before Realtime is used.
import "react-native-url-polyfill/auto"

import { createClient } from "@supabase/supabase-js"
import { AppState } from "react-native"

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/constants"
import { secureStorageAdapter } from "./secureStorageAdapter"

// React Native differs from the web client in four ways that all matter:
//   - storage: there is no localStorage, so the keystore adapter is explicit (D6-A)
//   - detectSessionInUrl: false — there is no URL bar to parse a session out of;
//     deep links are handled explicitly by the reset-password screen (I4)
//   - flowType: "pkce" — the correct flow for a public client that cannot hold a
//     secret. The web apps use the implicit flow; this is a deliberate divergence
//   - auto-refresh is tied to AppState below, because a backgrounded app must not
//     keep a refresh timer running
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
})

// Refresh tokens only while the app is in the foreground. Without this, a
// backgrounded app either burns battery on timers the OS will suspend anyway, or
// resumes after hours with an expired token and fails its first query — the exact
// failure mode the plan's I1 exists to prevent.
let appStateSubscription: { remove: () => void } | null = null

export function startAuthAutoRefresh(): () => void {
  if (AppState.currentState === "active") supabase.auth.startAutoRefresh()

  appStateSubscription?.remove()
  appStateSubscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })

  return () => {
    appStateSubscription?.remove()
    appStateSubscription = null
    supabase.auth.stopAutoRefresh()
  }
}
