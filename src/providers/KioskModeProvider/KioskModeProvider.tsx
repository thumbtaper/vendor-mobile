import { createContext, useContext, type ReactNode } from "react"
import { useKioskModeProvider } from "./useKioskModeProvider"

const Context = createContext<ReturnType<typeof useKioskModeProvider> | null>(null)
export function KioskModeProvider({ children }: { children: ReactNode }) {
  const state = useKioskModeProvider()
  return <Context.Provider value={state}>{children}</Context.Provider>
}
export function useKioskMode() {
  const context = useContext(Context)
  if (!context) throw new Error("KioskModeProvider is required")
  return context
}
