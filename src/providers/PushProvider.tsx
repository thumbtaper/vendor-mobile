import { createContext, useContext, type ReactNode } from "react"

import { usePushRegistration, type PushState } from "@/hooks/usePushRegistration"
import { useSessionGate } from "@/providers/SessionGateProvider"

interface PushApi {
  state: PushState
  enable: () => Promise<void>
  disable: () => Promise<void>
}

const PushContext = createContext<PushApi | null>(null)

// Mounted once inside the authenticated tab group. Registration, the tap-to-route
// listener and the foreground listener all need to exist regardless of which tab
// is showing, and mounting them per screen would register duplicate listeners.
export function PushProvider({ children }: { children: ReactNode }) {
  const { session } = useSessionGate()
  const push = usePushRegistration(Boolean(session))

  return <PushContext.Provider value={push}>{children}</PushContext.Provider>
}

export function usePush(): PushApi {
  const ctx = useContext(PushContext)
  if (!ctx) throw new Error("usePush must be used inside PushProvider")
  return ctx
}
