import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"
import { StyleSheet } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { ConfigErrorScreen } from "@/components/common/ConfigErrorScreen/ConfigErrorScreen"
import { MISSING_CONFIG } from "@/lib/constants"

import { registerForegroundNotificationHandler } from "@/lib/notifications"
import { persistOptions, queryClient, startFocusTracking } from "@/lib/queryClient"
import { SessionGateProvider } from "@/providers/SessionGateProvider"
import { KioskModeProvider } from "@/providers/KioskModeProvider/KioskModeProvider"
import { RootNavigator } from "@/components/layout/RootNavigator/RootNavigator"
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
                <KioskModeProvider>
                  <RootNavigator />
                </KioskModeProvider>
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
