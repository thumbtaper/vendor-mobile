import { Stack } from "expo-router"
import { SnackbarProvider } from "@/providers/SnackbarProvider"
import { useRootNavigator } from "./useRootNavigator"

export function RootNavigator() {
  const s = useRootNavigator()
  if (s.restoring) return null
  return (
    <SnackbarProvider key={s.contained ? "kiosk" : "staff"}>
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={s.contained}>
          <Stack.Screen name="kiosk" options={{ gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!s.contained}>
          <Stack.Screen name="reset-password" />
          <Stack.Protected guard={!s.signedIn}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="forgot-password" />
          </Stack.Protected>
          <Stack.Protected guard={s.signedIn && s.gate.status === "blocked"}>
            <Stack.Screen name="blocked" />
          </Stack.Protected>
          <Stack.Protected guard={s.signedIn && s.gate.status === "choosing"}>
            <Stack.Screen name="select-vendor" />
          </Stack.Protected>
          <Stack.Protected guard={s.signedIn && s.gate.status === "ready"}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
        </Stack.Protected>
      </Stack>
    </SnackbarProvider>
  )
}
