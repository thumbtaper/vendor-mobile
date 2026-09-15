import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useKioskMode } from "@/providers/KioskModeProvider/KioskModeProvider"
import { useSessionGate } from "@/providers/SessionGateProvider"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./KioskStaffDialog.styles"

export function useKioskStaffDialog(exit: boolean, onClose: () => void) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const { session } = useSessionGate()
  const { staffAccess } = useKioskMode()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  const close = useCallback(() => { if (!pending.current) { setPassword(""); onClose() } }, [onClose])
  const submit = useCallback(async () => {
    if (pending.current || !password) return
    pending.current = true
    setBusy(true); setError(null); setPassword("")
    try {
      await staffAccess(session?.user.email ?? email, password, session?.user.id ?? null, exit)
      if (mounted.current) onClose()
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : "Staff verification failed.")
    } finally {
      pending.current = false
      if (mounted.current) setBusy(false)
    }
  }, [email, exit, onClose, password, session, staffAccess])
  return { styles, email, setEmail, password, setPassword, error, busy, close, submit, needsEmail: !session?.user.email }
}
