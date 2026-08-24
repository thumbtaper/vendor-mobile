import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"
import { StyleSheet } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { ConfigErrorScreen } from "@/components/common/ConfigErrorScreen/ConfigErrorScreen"
import { MISSING_CONFIG } from "@/lib/constants"

import { registerForegroundNotificationHandler } from "@/lib/notifications"
import { persistOptions, queryClient, startFocusTracking } from "@/lib/queryClient"
import { SessionGateProvider, useSessionGate } from "@/providers/SessionGateProvider"
import { SnackbarProvider } from "@/providers/SnackbarProvider"
import { AppThemeProvider } from "@/theme/AppThemeProvider"

// expo-router looks for a named `ErrorBoundary` export on a route module and
// wraps that route in `Try` only when it finds one — there is no default in a
// release build (`expo-router/build/useScreens.js:146`). Declared on the root
// layout so it covers every route beneath it: no other route exports one, so a
// crash anywhere propagates up to this single boundary.
//
// Re-exported rather than defined here, because route files in this app stay
// pure composition. The component is deliberately self-contained — it renders
// OUTSIDE this file's provider tree; see its own header before editing it.
//
// Must sit below the imports: `import/first` treats a re-export as module body
// and flags every import after it.
export { AppErrorBoundary as ErrorBoundary } from "@/components/common/AppErrorBoundary/AppErrorBoundary"

// Module-scope, so an unhandled rejection here would surface as a startup crash
// with no on-screen error. A splash that hides early is a cosmetic problem; a
// crash is not.
SplashScreen.preventAutoHideAsync().catch(() => {})

// Safe to call at module scope now that it loads the native module lazily and
// no-ops when it is absent (Expo Go). Must run before any notification arrives.
registerForegroundNotificationHandler()

function RootNavigator() {
  const { session, isRestoring, isRecovering, gate } = useSessionGate()

  // Hold the native splash until the persisted session has been read. Without
  // this the app flashes the sign-in screen before restoring, which reads as
  // being signed out.
  useEffect(() => {
    if (!isRestoring) SplashScreen.hideAsync().catch(() => {})
  }, [isRestoring])

  if (isRestoring) return null

  const signedIn = Boolean(session) && !isRecovering

  return (
    // `initialRouteName` is load-bearing, not cosmetic. When a guard change
    // removes every screen currently on the stack, StackRouter falls back to
    // this name — and without it, to `routeNames[0]`, which is the first
    // DECLARED screen (`reset-password`, below). Every guard here is false for
    // as long as the vendor gate is "checking", which sign-in, sign-out and
    // switch-vendor all pass through, so that fallback is reached routinely.
    // `index` is never guarded and owns the "where does this user belong"
    // decision, so it is the only correct destination.
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      {/* Unguarded, and deliberately so (I4). The recovery link creates a
          session, so a `!signedIn` guard would eject the user the moment the
          code is exchanged; a `signedIn` guard would block the expired-link
          error path, where there is no session at all. */}
      <Stack.Screen name="reset-password" />

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && gate.status === "blocked"}>
        <Stack.Screen name="blocked" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && gate.status === "choosing"}>
        <Stack.Screen name="select-vendor" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && gate.status === "ready"}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  useEffect(() => startFocusTracking(), [])

  if (!fontsLoaded) return null

  return (
    // Required for the swipe actions on notification rows — gesture-handler
    // needs this at the root or gestures silently never fire on Android.
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppThemeProvider>
          {/* Above every provider that issues a request, so a misconfigured
              build reports itself instead of failing its first query against
              placeholder credentials. Inside AppThemeProvider, so the screen
              still honours the user's light/dark setting — that provider reads
              only AsyncStorage and the OS scheme, nothing configuration-bound. */}
          {MISSING_CONFIG.length > 0 ? (
            <ConfigErrorScreen missing={MISSING_CONFIG} />
          ) : (
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={persistOptions}
            >
              <SessionGateProvider>
                <SnackbarProvider>
                  <RootNavigator />
                </SnackbarProvider>
              </SessionGateProvider>
            </PersistQueryClientProvider>
          )}
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
