import * as WebBrowser from "expo-web-browser"
import { useCallback, useState } from "react"

import { WEB_PORTAL_URL } from "@/lib/constants"
import { usePush } from "@/providers/PushProvider"
import { useSessionGate } from "@/providers/SessionGateProvider"
import { signOut } from "@/services/auth.service"
import { useAppTheme, type ThemePreference } from "@/theme/useAppTheme"

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
]

export function useSettingsList() {
  const { gate } = useSessionGate()
  const { preference, setPreference } = useAppTheme()
  const push = usePush()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    // Drop the push token BEFORE ending the session: leaving it behind would keep
    // sending this vendor's booking alerts to a phone nobody is signed in on.
    // Failure here must not trap the user in a signed-in state, so it is not
    // allowed to block the sign-out.
    try {
      await push.disable()
    } catch {
      // ignored — see above
    }
    await signOut()
    // No navigation — the session change flips the route guards.
    setSigningOut(false)
  }, [push])

  const openPortal = useCallback(() => {
    if (WEB_PORTAL_URL) WebBrowser.openBrowserAsync(WEB_PORTAL_URL)
  }, [])

  // D13-A: account deletion opens the web portal's deletion route. That route
  // does not exist yet (B6) — until it does, this points at the portal root
  // rather than at a 404, which would be worse than no link at a store review.
  const openAccountDeletion = useCallback(() => {
    if (WEB_PORTAL_URL) WebBrowser.openBrowserAsync(WEB_PORTAL_URL)
  }, [])

  return {
    preference,
    setPreference,
    pushState: push.state,
    enablePush: push.enable,
    vendorName: gate.selectedVendorName,
    canSwitchVendor: gate.vendors.length > 1,
    switchVendor: gate.clearVendor,
    signingOut,
    handleSignOut,
    hasPortal: Boolean(WEB_PORTAL_URL),
    openPortal,
    openAccountDeletion,
  }
}
