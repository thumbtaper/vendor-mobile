import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import { AppState } from "react-native"

import { KioskModeStore, kioskContainsStaff } from "@/lib/kioskMode"
import { authenticateKioskStaff, checkKioskAccess } from "@/services/kioskAccess.service"

export function useKioskModeProvider() {
  const [store] = useState(() => new KioskModeStore(AsyncStorage))
  const mode = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  useEffect(() => { void store.restore() }, [store])

  const launch = useCallback(async (vendorId: string) => {
    if (!__DEV__) throw new Error("Kiosk launch is not available in this release.")
    await checkKioskAccess(vendorId)
    await store.enter(vendorId)
  }, [store])

  const staffAccess = useCallback(async (email: string, password: string, userId: string | null, exit: boolean) => {
    const current = store.getSnapshot()
    if (current.status !== "active") throw new Error("Kiosk is not ready.")
    let interrupted = AppState.currentState !== "active"
    const subscription = AppState.addEventListener("change", state => {
      if (state !== "active") interrupted = true
    })
    const assertCurrent = () => {
      if (interrupted || store.getSnapshot() !== current) {
        throw new Error("Staff verification was interrupted. Please retry.")
      }
    }
    try {
      assertCurrent()
      await authenticateKioskStaff(current.vendorId, email, password, userId, assertCurrent)
      assertCurrent()
      if (exit) await store.leave()
    } finally {
      subscription.remove()
    }
  }, [store])

  return { mode, contained: kioskContainsStaff(mode), launch, staffAccess, retryStorage: store.restore }
}
