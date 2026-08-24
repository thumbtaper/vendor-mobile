import * as WebBrowser from "expo-web-browser"
import { useCallback, useState } from "react"

import { useBottomInset } from "@/hooks/useBottomInset"
import { WEB_PORTAL_URL, PRIVACY_POLICY_URL, ACCOUNT_DELETION_URL } from "@/lib/constants"
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
  const bottomInset = useBottomInset({ tabBar: true })

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

  /*
   * Account deletion, and the privacy policy — both UNGATED (B2/B3).
   *
   * These used to point at the portal ROOT and be hidden whenever
   * `EXPO_PUBLIC_VENDOR_PORTAL_URL` was unset, with a comment explaining that the real
   * deletion page did not exist yet. It does now
   * (`https://ezzy.ph/account-data-deletion/`, verified 200 on 2026-08-23), so both are
   * plain constants: a store submission cannot lose them to a missing build variable.
   */
  const openAccountDeletion = useCallback(() => {
    WebBrowser.openBrowserAsync(ACCOUNT_DELETION_URL)
  }, [])

  const openPrivacyPolicy = useCallback(() => {
    WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)
  }, [])

  return {
    // `tabBar: true` — Settings is inside the tab navigator. `href: null`
    // (`app/(app)/_layout.tsx`) only hides it FROM the bar; the bar still renders
    // over it, and `position: "absolute"` means it takes no layout space. Without
    // this the last rows — sign out among them — sat under the floating bar plus
    // the system navigation (plan B2). Every other scroll surface in the app
    // already composed this; this one never did.
    bottomInset,
    preference,
    setPreference,
    pushState: push.state,
    enablePush: push.enable,
    vendorName: gate.selectedVendorName,
    canSwitchVendor: gate.vendors.length > 1,
    switchVendor: gate.clearVendor,
    signingOut,
    handleSignOut,
    // Gates ONLY the "open the web portal" row now. Privacy and deletion are
    // unconditional — see the note above openAccountDeletion.
    hasPortal: Boolean(WEB_PORTAL_URL),
    openPortal,
    openPrivacyPolicy,
    openAccountDeletion,
  }
}
