import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AppState, BackHandler } from "react-native"
import { KIOSK_IDLE_MS } from "@/lib/kioskMode"
import { useKioskMode } from "@/providers/KioskModeProvider/KioskModeProvider"
import { useSessionGate } from "@/providers/SessionGateProvider"
import { checkKioskAccess, KioskAccessError } from "@/services/kioskAccess.service"
import { useAppTheme } from "@/theme/useAppTheme"
import type { Gradient } from "@/theme/tokens"
import { makeStyles } from "./KioskShell.styles"
import { reviewExpired } from "@/lib/kioskCustomer"
import { openKioskReviewBrowser } from "@/services/kioskDocuments.service"
import { openKioskPaymentBrowser } from "@/services/kioskPayment.service"

type KioskSurface = "catalogue" | "closeout"

const KIOSK_PAGE_BG = {
  light: { colors: ["#f8fafc", "#eef2ff", "#e0e7ff"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  dark: { colors: ["#04060e", "#070b17", "#0d1b4b"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
} satisfies Record<"light" | "dark", Gradient>

export function useKioskShell() {
  const { tokens, isDark } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const { mode, retryStorage } = useKioskMode()
  const { session, isRecovering } = useSessionGate()
  const [active, setActive] = useState(AppState.currentState === "active")
  const [attempt, setAttempt] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const [browsing, setBrowsing] = useState<KioskSurface | false>(false)
  const [activity, setActivity] = useState(0)
  const handoff = useRef<{ startedAt: number } | null>(null)
  const [browserOpen, setBrowserOpen] = useState(false)
  const [preserveOwner, setPreserveOwner] = useState<string | null>(null)
  const [staffDialog, setStaffDialog] = useState<"exit" | "signin" | null>(null)
  const [result, setResult] = useState<{
    session: typeof session; attempt: number; vendorId: string
    vendorName?: string; error?: string; kind?: string
  } | null>(null)
  const vendorId = mode.vendorId
  const reset = useCallback(() => {
    handoff.current = null; setBrowserOpen(false); setPreserveOwner(null)
    setResetKey(key => key + 1); setStaffDialog(null); setBrowsing(false)
  }, [])
  const retry = useCallback(() => { setAttempt(value => value + 1) }, [])
  useEffect(() => {
    const back = BackHandler.addEventListener("hardwareBackPress", () => true)
    const app = AppState.addEventListener("change", state => {
      setActive(state === "active")
      setResult(null)
      if (!handoff.current || reviewExpired(handoff.current.startedAt, Date.now())) reset()
      if (state === "active") retry()
    })
    return () => { back.remove(); app.remove() }
  }, [reset, retry])

  useEffect(() => {
    if (!vendorId || !active || !session || isRecovering) return
    let cancelled = false
    checkKioskAccess(vendorId).then(access => {
      if (!cancelled) {
        setResult({ session, attempt, vendorId, vendorName: access.vendorName })
        if (!handoff.current) setPreserveOwner(null)
      }
    }).catch(error => {
      if (!cancelled) {
        reset()
        setResult({ session, attempt, vendorId,
          error: error instanceof KioskAccessError ? error.message : "Cannot connect. Please ask staff for help.",
          kind: error instanceof KioskAccessError ? error.kind : "connection" })
      }
    })
    return () => { cancelled = true }
  }, [active, attempt, isRecovering, reset, session, vendorId])

  const checked = result?.session === session && result?.attempt === attempt && result?.vendorId === vendorId
  const ready = active && !isRecovering && Boolean(session) && result?.session === session && result?.vendorId === vendorId && !result?.error
  useEffect(() => {
    if (!active || !session || staffDialog || browserOpen) return
    const idle = setTimeout(reset, KIOSK_IDLE_MS)
    return () => { clearTimeout(idle) }
  }, [active, session, staffDialog, reset, resetKey, activity, browserOpen])

  useEffect(() => {
    if (!ready || staffDialog || browserOpen) return
    const accessRefresh = setTimeout(retry, 60_000)
    return () => { clearTimeout(accessRefresh) }
  }, [ready, staffDialog, retry, result, browserOpen])

  const handoffBrowser = useCallback(async (url: string, open: (url: string) => Promise<void>) => {
    if (!session || handoff.current || AppState.currentState !== "active") throw new Error("Browser unavailable")
    const current = { startedAt: Date.now() }
    handoff.current = current
    setPreserveOwner(session.user.id)
    setBrowserOpen(true)
    try { await open(url) }
    finally {
      if (handoff.current === current) {
        handoff.current = null
        setBrowserOpen(false)
        if (reviewExpired(current.startedAt, Date.now())) reset()
        else { setResult(null); retry(); setActivity(value => value + 1) }
      }
    }
  }, [session, reset, retry])

  return {
    styles, tokens, isDark, pageBg: KIOSK_PAGE_BG[isDark ? "dark" : "light"], mode, ready, active, resetKey, staffDialog,
    browsing, home: reset,
    review: useCallback((url: string) => handoffBrowser(url, openKioskReviewBrowser), [handoffBrowser]),
    payment: useCallback((url: string) => handoffBrowser(url, openKioskPaymentBrowser), [handoffBrowser]),
    browserOpen,
    mountCatalogue: browsing === "catalogue" && Boolean(session) && !isRecovering && (ready || preserveOwner === session?.user.id),
    openCatalogue: useCallback(() => setBrowsing("catalogue"), []),
    openCloseOut: useCallback(() => setBrowsing("closeout"), []),
    touch: useCallback(() => setActivity(value => value + 1), []),
    staffIdentity: session?.user.id ?? "signed-out",
    vendorName: ready ? result?.vendorName : null,
    checking: active && Boolean(session) && !isRecovering && !checked && mode.status === "active",
    message: !session || isRecovering ? "Staff sign-in is required." : checked ? result?.error : null,
    retry: mode.status === "storage_error" ? retryStorage : retry,
    openExit: useCallback(() => setStaffDialog("exit"), []),
    openSignIn: useCallback(() => setStaffDialog("signin"), []),
    closeStaff: useCallback(() => { setStaffDialog(null); retry() }, [retry]),
  }
}
