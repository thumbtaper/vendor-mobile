import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useKioskMode } from "@/providers/KioskModeProvider/KioskModeProvider"
import { getKioskLaunchSummary } from "@/services/kioskAccess.service"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./KioskLauncher.styles"

export function useKioskLauncher(vendorId: string, onClose: () => void) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const kiosk = useKioskMode()
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getKioskLaunchSummary>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const busy = useRef(false)
  useEffect(() => {
    let cancelled = false
    getKioskLaunchSummary(vendorId).then(value => {
      if (!cancelled) { setSummary(value); setError(null) }
    }).catch(() => {
      if (!cancelled) setError("Could not load kiosk availability. Check your connection and staff access.")
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [vendorId, attempt])
  const retry = useCallback(() => {
    setLoading(true); setSummary(null); setError(null); setAttempt(value => value + 1)
  }, [])
  const close = useCallback(() => { if (!busy.current) onClose() }, [onClose])
  const start = useCallback(async () => {
    if (busy.current || !summary) return
    busy.current = true
    setStarting(true)
    try { await kiosk.launch(vendorId) }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not start kiosk.") }
    finally { busy.current = false; setStarting(false) }
  }, [kiosk, summary, vendorId])
  return {
    styles, loading, starting, error, summary, retry, close, start,
    eligibleCount: summary?.offerings.filter(offering => !offering.reason).length ?? 0,
    excluded: summary?.offerings.filter(offering => offering.reason) ?? [],
  }
}
