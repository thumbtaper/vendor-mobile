import { createContext, useContext } from "react"
import type { Tokens } from "./tokens"

export type ThemePreference = "light" | "dark" | "system"

export interface AppTheme {
  tokens: Tokens
  isDark: boolean
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
}

// Ph2 mounts the provider (it owns the OS-scheme subscription and the persisted
// override). Kept here so `makeStyles(tokens)` consumers have a stable import
// path from Ph0 onward.
export const AppThemeContext = createContext<AppTheme | null>(null)

export function useAppTheme(): AppTheme {
  const ctx = useContext(AppThemeContext)
  if (!ctx) throw new Error("useAppTheme must be used inside AppThemeProvider")
  return ctx
}
