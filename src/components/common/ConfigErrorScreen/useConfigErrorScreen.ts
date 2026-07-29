import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"

// `app/_layout.tsx` holds the native splash at module scope and only releases it
// once the persisted session has been read. On this path that never happens —
// the provider tree that would restore the session is precisely what we render
// instead — so the splash is dismissed here. Without it the error screen is
// fully obscured and the app looks like it hung, which is the failure mode this
// screen exists to replace.
export function useConfigErrorScreen(): void {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])
}
