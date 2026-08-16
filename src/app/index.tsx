import { Redirect } from "expo-router"
import { ActivityIndicator } from "react-native"

import { AuthScreen } from "@/components/common/AuthScreen/AuthScreen"
import { BrandMark } from "@/components/common/BrandMark/BrandMark"
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
      // The logo rather than `showBrand`'s "Ezzy Vendor / Vendor Portal" text:
      // this hands over from the native splash, which shows the same mark, so the
      // two frames read as one screen instead of a wordmark appearing for the
      // half-second the session takes to resolve. `shell`'s `gap` spaces them.
      return (
        <AuthScreen showBrand={false}>
          <BrandMark />
          <ActivityIndicator accessibilityLabel="Signing you in" />
        </AuthScreen>
      )
  }
}
