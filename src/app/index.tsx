import { Redirect } from "expo-router"
import { ActivityIndicator } from "react-native"

import { AuthScreen } from "@/components/common/AuthScreen/AuthScreen"
import { useSessionGate } from "@/providers/SessionGateProvider"

// The anchor route. `Stack.Protected` sends a user here whenever a guard turns
// false, so this is the one place that decides where they actually belong —
// keeping that decision in a single file rather than spread across screens.
export default function Index() {
  const { session, isRecovering, gate } = useSessionGate()

  if (isRecovering) return <Redirect href="/reset-password" />
  if (!session) return <Redirect href="/sign-in" />

  switch (gate.status) {
    case "blocked":
      return <Redirect href="/blocked" />
    case "choosing":
      return <Redirect href="/select-vendor" />
    case "ready":
      return <Redirect href="/dashboard" />
    default:
      return (
        <AuthScreen showBrand={false}>
          <ActivityIndicator />
        </AuthScreen>
      )
  }
}
