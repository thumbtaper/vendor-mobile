import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState } from "react"

import { VENDOR_STORAGE_KEY } from "@/lib/constants"
import { purgePersistedCache } from "@/lib/queryClient"
import { getUserVendors, type BlockedReason, type DbVendor } from "@/services/vendor.service"
import { blockedReasonFor, isVendorUsable } from "@/services/vendorMapping"

// Defined with the rule it comes from (services/vendorMapping.ts); re-exported so the
// blocked screen keeps importing it from the gate.
export type { BlockedReason }

interface GateState {
  status: "checking" | "blocked" | "choosing" | "ready"
  blockedReason: BlockedReason | null
  vendors: DbVendor[]
  selectedVendorId: string | null
  selectedVendorName: string | null
}

export interface VendorGate extends GateState {
  selectVendor: (id: string) => Promise<void>
  clearVendor: () => Promise<void>
  refresh: () => void
}

const INITIAL: GateState = {
  status: "checking",
  blockedReason: null,
  vendors: [],
  selectedVendorId: null,
  selectedVendorName: null,
}

// Ports the access gate in `vendor/components/layout/AppShell/useAppShell.ts`
// (lines 103-148) with one deliberate behavioural change, per D5-A.
//
// The web app signs out a user who has no vendor at all, dropping them back to a
// login screen with no explanation. On mobile that reads as a broken login, and
// it is exactly the state an app-store reviewer reaches with a fresh account — a
// dead end there is a rejection. So the session is kept and the reason is shown.
export function useVendorGate(hasSession: boolean): VendorGate {
  const [state, setState] = useState<GateState>(INITIAL)
  const [nonce, setNonce] = useState(0)

  // Reset during render when the session appears or disappears, rather than in an
  // effect. This is React's documented "adjusting state when a prop changes"
  // pattern, and it matters for correctness here as much as for lint: resetting
  // in an effect would leave the PREVIOUS user's vendor on screen for a frame
  // after a sign-out or an account switch.
  const [prevHasSession, setPrevHasSession] = useState(hasSession)
  if (prevHasSession !== hasSession) {
    setPrevHasSession(hasSession)
    setState(INITIAL)
  }

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!hasSession) return

    let cancelled = false

    async function run() {
      const all = await getUserVendors()
      if (cancelled) return

      // Usable = active AND KYC approved (plan 2026-09-30-vendor-signup-before-kyc
      // M1, mirroring the web gate). Activation alone used to be enough.
      const usable = all.filter(isVendorUsable)

      if (usable.length === 0) {
        // Distinguishing the reasons is the whole point of not filtering by status
        // in the service — each one needs different copy and a different next step.
        setState({
          ...INITIAL,
          status: "blocked",
          blockedReason: blockedReasonFor(all),
        })
        return
      }

      if (usable.length === 1) {
        await AsyncStorage.setItem(VENDOR_STORAGE_KEY, usable[0].id)
        if (cancelled) return
        setState({
          ...INITIAL,
          status: "ready",
          vendors: usable,
          selectedVendorId: usable[0].id,
          selectedVendorName: usable[0].name,
        })
        return
      }

      const stored = await AsyncStorage.getItem(VENDOR_STORAGE_KEY)
      if (cancelled) return

      const match = stored ? usable.find((v) => v.id === stored) : undefined
      setState({
        ...INITIAL,
        status: match ? "ready" : "choosing",
        vendors: usable,
        selectedVendorId: match?.id ?? null,
        selectedVendorName: match?.name ?? null,
      })
    }

    run()
    return () => {
      cancelled = true
    }
  }, [hasSession, nonce])

  const selectVendor = useCallback(
    async (id: string) => {
      const match = state.vendors.find((v) => v.id === id)
      if (!match) return
      // Switching vendors must drop cached data as well as the selection, or the
      // next screen renders the previous vendor's bookings (D11).
      await purgePersistedCache()
      await AsyncStorage.setItem(VENDOR_STORAGE_KEY, id)
      setState((s) => ({
        ...s,
        status: "ready",
        selectedVendorId: match.id,
        selectedVendorName: match.name,
      }))
    },
    [state.vendors],
  )

  const clearVendor = useCallback(async () => {
    await purgePersistedCache()
    await AsyncStorage.removeItem(VENDOR_STORAGE_KEY)
    setState((s) => ({
      ...s,
      status: s.vendors.length > 1 ? "choosing" : "checking",
      selectedVendorId: null,
      selectedVendorName: null,
    }))
  }, [])

  return { ...state, selectVendor, clearVendor, refresh }
}
