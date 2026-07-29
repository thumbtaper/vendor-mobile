import type { Session } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

import { startAuthAutoRefresh } from "@/lib/supabase/client"
import { getSession, onAuthStateChange } from "@/services/auth.service"

export interface SessionState {
  session: Session | null
  /** True until the stored session has been read — guards render a splash, not a sign-in screen. */
  isRestoring: boolean
  /** A password-recovery link was opened; takes precedence over the normal gate (I4). */
  isRecovering: boolean
}

// Restores the persisted session, then tracks auth changes. Also owns the
// AppState auto-refresh wiring, so exactly one subscription exists for the
// lifetime of the app.
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)
  const [isRecovering, setIsRecovering] = useState(false)

  useEffect(() => {
    const stopAutoRefresh = startAuthAutoRefresh()

    let cancelled = false
    getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setIsRestoring(false)
    })

    const {
      data: { subscription },
    } = onAuthStateChange((event, next) => {
      // PASSWORD_RECOVERY arrives with a valid session that must NOT be treated
      // as a normal sign-in — otherwise the user lands on the dashboard and the
      // reset screen never shows.
      if (event === "PASSWORD_RECOVERY") setIsRecovering(true)
      if (event === "SIGNED_OUT") setIsRecovering(false)
      setSession(next)
      setIsRestoring(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
      stopAutoRefresh()
    }
  }, [])

  return { session, isRestoring, isRecovering }
}
