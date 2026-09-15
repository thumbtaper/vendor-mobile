import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"
import { useKioskMode } from "@/providers/KioskModeProvider/KioskModeProvider"
import { useSessionGate } from "@/providers/SessionGateProvider"

export function useRootNavigator() {
  const { session, isRestoring, isRecovering, gate } = useSessionGate()
  const { mode, contained } = useKioskMode()
  const restoring = isRestoring || mode.status === "restoring"
  useEffect(() => {
    if (!restoring) SplashScreen.hideAsync().catch(() => {})
  }, [restoring])
  return { restoring, contained, gate, signedIn: Boolean(session) && !isRecovering }
}
