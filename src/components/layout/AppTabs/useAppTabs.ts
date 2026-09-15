import { useCallback, useState } from "react"
import { AppState } from "react-native"
import { useBookingsRealtime } from "@/hooks/useBookingsRealtime"
import { useUnreadCount } from "@/hooks/useNotificationsQuery"
import { useNotificationsRealtime } from "@/hooks/useNotificationsRealtime"
import { useSessionGate } from "@/providers/SessionGateProvider"
import { useAppTheme } from "@/theme/useAppTheme"

export function useAppTabs() {
  const { tokens, isDark } = useAppTheme()
  const { session, gate } = useSessionGate()
  const unread = useUnreadCount()
  const [launchOpen, setLaunchOpen] = useState(false)
  useNotificationsRealtime(session?.user.id ?? null)
  useBookingsRealtime(gate.selectedVendorId)
  const openLauncher = useCallback((event: { preventDefault: () => void }) => {
    event.preventDefault()
    if (__DEV__ && AppState.currentState === "active") setLaunchOpen(true)
  }, [])
  const closeLauncher = useCallback(() => setLaunchOpen(false), [])
  return { tokens, isDark, unread, launchOpen, openLauncher, closeLauncher, vendorId: gate.selectedVendorId, launchEnabled: __DEV__ }
}
