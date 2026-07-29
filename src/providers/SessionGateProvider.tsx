import { createContext, useContext, type ReactNode } from "react"

import { useSession, type SessionState } from "@/hooks/useSession"
import { useVendorGate, type VendorGate } from "@/hooks/useVendorGate"

interface SessionGate extends SessionState {
  gate: VendorGate
}

const SessionGateContext = createContext<SessionGate | null>(null)

// One source of truth for "who is signed in and what may they see". Both the
// route guards in `_layout.tsx` and the screens read it from here, so the guard
// and the screen can never disagree about the current state.
export function SessionGateProvider({ children }: { children: ReactNode }) {
  const session = useSession()
  const gate = useVendorGate(Boolean(session.session) && !session.isRecovering)

  return (
    <SessionGateContext.Provider value={{ ...session, gate }}>
      {children}
    </SessionGateContext.Provider>
  )
}

export function useSessionGate(): SessionGate {
  const ctx = useContext(SessionGateContext)
  if (!ctx) {
    throw new Error("useSessionGate must be used inside SessionGateProvider")
  }
  return ctx
}
