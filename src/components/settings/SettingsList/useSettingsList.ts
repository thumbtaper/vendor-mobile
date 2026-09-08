import * as WebBrowser from "expo-web-browser"
import { useCallback, useState } from "react"

import { useBottomInset } from "@/hooks/useBottomInset"
import {
  ACCOUNT_DELETION_URL,
  LEGAL_LINKS,
  WEB_PORTAL_URL,
  type LegalLink,
} from "@/lib/constants"
import { usePush } from "@/providers/PushProvider"
import { useSessionGate } from "@/providers/SessionGateProvider"
import { signOut } from "@/services/auth.service"
import { KioskApiError, verifyKioskAccess } from "@/services/kioskApi"
import { useAppTheme, type ThemePreference } from "@/theme/useAppTheme"

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
]

type KioskProbeState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }

type KioskProbeFailure = Extract<KioskProbeState, { kind: "error" }>

function kioskProbeFailure(status: number | null): KioskProbeFailure {
  if (status === 401) return { kind: "error", message: "The staging server rejected this session (401)." }
  if (status === 403) return { kind: "error", message: "The staging server denied this vendor (403)." }
  if (status !== null) return { kind: "error", message: `The staging server returned ${status}.` }
  return { kind: "error", message: "No response from the staging kiosk server." }
}

export function useSettingsList() {
  const { gate } = useSessionGate()
  const { preference, setPreference } = useAppTheme()
  const push = usePush()
  const [signingOut, setSigningOut] = useState(false)
  const [kioskProbe, setKioskProbe] = useState<KioskProbeState>({ kind: "idle" })
  const [probeVendorId, setProbeVendorId] = useState("")
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
   * Account deletion, and every legal policy link — all UNGATED (B2/B3).
   *
   * These used to point at the portal ROOT and be hidden whenever
   * `EXPO_PUBLIC_VENDOR_PORTAL_URL` was unset, with a comment explaining that the real
   * deletion page did not exist yet. It does now
   * (`https://ezzy.ph/account-data-deletion/`, verified 200 on 2026-08-23), and the legal
   * policies live on ezzy.ph, so these are plain constants: a store submission cannot lose
   * them to a missing build variable.
   */
  const openAccountDeletion = useCallback(() => {
    WebBrowser.openBrowserAsync(ACCOUNT_DELETION_URL)
  }, [])

  const openLegalLink = useCallback((link: LegalLink) => {
    WebBrowser.openBrowserAsync(link.href)
  }, [])

  const testSelectedVendorKioskAccess = useCallback(async () => {
    if (!gate.selectedVendorId) {
      setKioskProbe({ kind: "error", message: "Choose a vendor before testing kiosk access." })
      return
    }

    setKioskProbe({ kind: "running" })
    try {
      await verifyKioskAccess(gate.selectedVendorId)
      setKioskProbe({ kind: "success", message: "Access to the selected vendor succeeded." })
    } catch (error) {
      const status = error instanceof KioskApiError ? error.status : null
      setKioskProbe(kioskProbeFailure(status))
    }
  }, [gate.selectedVendorId])

  const testOtherVendorKioskAccess = useCallback(async () => {
    const targetVendorId = probeVendorId.trim()
    if (!targetVendorId) {
      setKioskProbe({ kind: "error", message: "Enter the other vendor’s UUID first." })
      return
    }

    setKioskProbe({ kind: "running" })
    try {
      await verifyKioskAccess(targetVendorId)
      setKioskProbe({
        kind: "error",
        message: "Unexpected access: this account may administer that vendor.",
      })
    } catch (error) {
      const status = error instanceof KioskApiError ? error.status : null
      setKioskProbe({
        kind: status === 403 ? "success" : "error",
        message: status === 403
          ? "Access to the other vendor was correctly denied (403)."
          : kioskProbeFailure(status).message,
      })
    }
  }, [probeVendorId])

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
    legalLinks: LEGAL_LINKS,
    openLegalLink,
    openAccountDeletion,
    showKioskProbe: __DEV__,
    kioskProbeTarget: WEB_PORTAL_URL ?? "Not configured",
    selectedVendorId: gate.selectedVendorId,
    kioskProbe,
    probeVendorId,
    setProbeVendorId,
    testSelectedVendorKioskAccess,
    testOtherVendorKioskAccess,
  }
}
