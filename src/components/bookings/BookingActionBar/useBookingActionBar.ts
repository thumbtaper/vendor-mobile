import { useCallback, useMemo, useState } from "react"

import type { FulfilAction } from "@/hooks/useBookingActions"
import { autoConfirmInfo } from "@/lib/autoConfirm"
import { actionCopy, type BookingActionCopy } from "@/lib/bookingActionCopy"
// The (status, pattern) -> action decision lives in its own module so it can be
// unit-tested without React — see the note at the top of that file.
import {
  canFlag,
  canUndo,
  fulfilActionFor,
  MIN_DISPUTE_REASON,
} from "@/lib/bookingActionRules"
import type { Booking } from "@/lib/types"

// Constant for the life of the app — resolved once at module load rather than
// memoised per booking. Both are stable references, which matters: they are
// handed straight to `visibleActions` below, and a fresh array each render would
// make that memo useless.
const APPROVE_COPY = actionCopy("vendor_approve")
const REJECT_COPY = actionCopy("vendor_reject")
const APPROVAL_ACTIONS: readonly BookingActionCopy[] = [
  APPROVE_COPY,
  REJECT_COPY,
]

/**
 * State and handlers for the booking action bar.
 *
 * Owns only local UI state; every mutation is passed in, so this component
 * depends on function signatures rather than on the data layer.
 */
export function useBookingActionBar(
  booking: Booking,
  onApprove: (booking: Booking) => void,
  onReject: (booking: Booking, reason: string) => Promise<void>,
  onFulfil: (booking: Booking, action: FulfilAction) => Promise<void>,
  onFlag: (booking: Booking, reason: string) => Promise<void>,
) {
  const [sheetOpen, setSheetOpen] = useState(false)
  // Guards a double tap. The database would reject the second write, but the
  // vendor would see an error for an action that actually succeeded.
  const [working, setWorking] = useState(false)
  // Separate from `sheetOpen`: that collects a REASON, this collects a
  // CONFIRMATION. One flag serving both would make the render layer guess which
  // question is being asked.
  const [confirmUnpaid, setConfirmUnpaid] = useState(false)
  // Whether the explanation sheet is open. A plain boolean since D2: the sheet
  // now lists EVERY action the bar is offering rather than one the vendor picked,
  // so there is nothing to remember about which trigger was tapped.
  const [infoOpen, setInfoOpen] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)

  const approve = useCallback(() => onApprove(booking), [onApprove, booking])
  const openSheet = useCallback(() => setSheetOpen(true), [])
  const closeSheet = useCallback(() => setSheetOpen(false), [])

  const confirmReject = useCallback(
    (reason: string) => onReject(booking, reason),
    [onReject, booking],
  )

  const fulfil = useMemo(() => fulfilActionFor(booking), [booking])
  const fulfilCopy = useMemo(
    () => (fulfil ? actionCopy(fulfil.key) : null),
    [fulfil],
  )
  const undoCopy = useMemo(
    () => (canUndo(booking.status) ? actionCopy("vendor_undo") : null),
    [booking.status],
  )

  const run = useCallback(
    async (action: FulfilAction) => {
      if (working) return
      setWorking(true)
      try {
        await onFulfil(booking, action)
      } finally {
        setWorking(false)
      }
    },
    [working, onFulfil, booking],
  )

  // ── I5: unpaid ────────────────────────────────────────────────────────────
  // A booking can run the whole fulfilment flow unpaid — the booker abandoned
  // PayMongo checkout — and no ledger row will ever exist for it, so the vendor is
  // about to deliver work they will not be paid for.
  //
  // WARNED, NEVER BLOCKED. Blocking would strand the booking with no exit: there
  // is no "collect payment" action in this app, so the vendor could neither
  // fulfil nor close it.
  const unpaidWarning =
    !booking.isPaid &&
    booking.status !== "cancelled" &&
    booking.status !== "pending"

  // The confirm step applies ONLY where the vendor is about to commit work — the
  // two `confirmed -> …` moves. Deliberately not on `returned -> completed`: by
  // then they have already handed over and been warned once, and a second prompt
  // at the finish line is nagging rather than protective.
  const needsUnpaidConfirm = unpaidWarning && booking.status === "confirmed"

  // ── I6: the auto-confirm countdown ────────────────────────────────────────
  const autoConfirm = useMemo(() => autoConfirmInfo(booking), [booking])

  // Split intent from execution so the render layer never has to know whether a
  // press will act or prompt.
  const doFulfil = useCallback(() => {
    if (!fulfil) return
    if (needsUnpaidConfirm) {
      setConfirmUnpaid(true)
      return
    }
    void run(fulfil.action)
  }, [fulfil, needsUnpaidConfirm, run])

  const confirmUnpaidFulfil = useCallback(() => {
    setConfirmUnpaid(false)
    if (fulfil) void run(fulfil.action)
  }, [fulfil, run])

  const cancelUnpaidFulfil = useCallback(() => setConfirmUnpaid(false), [])

  const doUndo = useCallback(() => void run("undo"), [run])

  const openInfo = useCallback(() => setInfoOpen(true), [])
  const closeInfo = useCallback(() => setInfoOpen(false), [])

  // ── I9: flag ──────────────────────────────────────────────────────────────
  const flagCopy = useMemo(
    () => (canFlag(booking.status) ? actionCopy("vendor_dispute") : null),
    [booking.status],
  )
  // ── D2: what the "i" sheet explains ───────────────────────────────────────
  // Every action the bar is currently rendering, in the order it renders them.
  //
  // Derived HERE, from the same four values the render layer branches on, and
  // deliberately not rebuilt in the `.tsx`. Two lists assembled from the same
  // inputs drift the moment a branch changes: the sheet would describe a button
  // that isn't on screen, or miss one that is. This is the single source.
  const visibleActions = useMemo<readonly BookingActionCopy[]>(() => {
    if (booking.status === "pending") return APPROVAL_ACTIONS
    return [fulfilCopy, undoCopy, flagCopy].filter(
      (copy): copy is BookingActionCopy => copy !== null,
    )
  }, [booking.status, fulfilCopy, undoCopy, flagCopy])

  const openFlag = useCallback(() => setFlagOpen(true), [])
  const closeFlag = useCallback(() => setFlagOpen(false), [])
  const confirmFlag = useCallback(
    (reason: string) => onFlag(booking, reason),
    [onFlag, booking],
  )

  return {
    sheetOpen,
    approve,
    openSheet,
    closeSheet,
    confirmReject,
    fulfilCopy,
    undoCopy,
    doFulfil,
    doUndo,
    working,
    unpaidWarning,
    confirmUnpaid,
    confirmUnpaidFulfil,
    cancelUnpaidFulfil,
    autoConfirm,
    // Exposed so the two buttons can take their accessibility hints from the copy
    // table instead of repeating the sentences as literals (I2).
    approveCopy: APPROVE_COPY,
    rejectCopy: REJECT_COPY,
    visibleActions,
    infoOpen,
    openInfo,
    closeInfo,
    flagCopy,
    flagOpen,
    openFlag,
    closeFlag,
    confirmFlag,
    minFlagReason: MIN_DISPUTE_REASON,
  }
}
