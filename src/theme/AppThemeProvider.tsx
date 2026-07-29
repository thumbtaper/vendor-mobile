import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useColorScheme } from "react-native"

import { AppThemeContext, type ThemePreference } from "./useAppTheme"
import { darkTokens, lightTokens } from "./tokens"

const PREFERENCE_KEY = "ezzy.vendor.themePreference"

function isPreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system"
}

// Follows the OS scheme by default — `app.json` already declares
// `"userInterfaceStyle": "automatic"` — with a manual override persisted across
// launches, matching the web app's next-themes toggle.
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const osScheme = useColorScheme()
  const [preference, setPreferenceState] = useState<ThemePreference>("system")

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(PREFERENCE_KEY).then((stored) => {
      if (!cancelled && isPreference(stored)) setPreferenceState(stored)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    // Fire-and-forget: a failed write costs the user their theme choice on the
    // next launch, which is not worth blocking the UI on.
    AsyncStorage.setItem(PREFERENCE_KEY, next)
  }, [])

  const value = useMemo(() => {
    const isDark =
      preference === "system" ? osScheme === "dark" : preference === "dark"
    return {
      tokens: isDark ? darkTokens : lightTokens,
      isDark,
      preference,
      setPreference,
    }
  }, [preference, osScheme, setPreference])

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  )
}
