import { useQueryClient } from "@tanstack/react-query"
import * as Haptics from "expo-haptics"
import { useCallback, useEffect, useRef } from "react"
import { AppState } from "react-native"

import type { Booking, BookingStatus } from "@/lib/types"
import { useSnackbar } from "@/providers/SnackbarProvider"
import {
  approveBooking,
  confirmReturn,
  markFulfilled,
  raiseDispute,
  rejectBooking,
  StaleBookingError,
  startCustody,
  undoFulfilment,
} from "@/services/bookings.service"

const UNDO_WINDOW_MS = 4000

/**
 * The four vendor fulfilment moves, as tables rather than four near-identical
 * handlers — the action, its target status, its service call and its failure
 * message then cannot drift apart. Mirrors `vendor/.../useAppShell.ts:26-47`.
 */
export type FulfilAction = "fulfil" | "start" | "confirm_return" | "undo"

const FULFIL_TARGET: Record<FulfilAction, BookingStatus> = {
  fulfil: "fulfilled",
  start: "in_progress",
  confirm_return: "completed",
  undo: "confirmed",
}

const FULFIL_CALL: Record<FulfilAction, (id: string) => Promise<void>> = {
  fulfil: markFulfilled,
  start: startCustody,
  confirm_return: confirmReturn,
  undo: undoFulfilment,
}

const FULFIL_ERROR: Record<FulfilAction, string> = {
  fulfil: "Couldn't mark this as done. Please try again.",
  start: "Couldn't start this booking. Please try again.",
  confirm_return: "Couldn't confirm the return. Please try again.",
  undo: "Couldn't undo that. Please try again.",
}

const FULFIL_DONE: Record<FulfilAction, string> = {
  fulfil: "Marked as done",
  start: "Handed over",
  confirm_return: "Confirmed — your payout is on the way",
  undo: "Put back a step",
}

// ─────────────────────────────────────────────────────────────────────────────
// Why approve DEFERS the write instead of writing then undoing.
//
// The plan's §5.2 asks for a one-tap approve with a ~4s Undo. The obvious
// implementation — write immediately, then reverse on Undo — is IMPOSSIBLE here:
// `validate_booking_status_transition` (20260516000004) allows
// `pending → confirmed` but NOT `confirmed → pending`. A compensating write
// would be rejected by the database, leaving the UI claiming an undo that never
// happened.
//
// So the approval is held locally for the undo window and only then sent. The
// cost is that the write must be flushed if the app leaves the foreground or the
// screen unmounts inside that window, which is what `flush()` below is for.
// Reject does not defer: its reason sheet is already a deliberate confirmation
// step, and a second one would be noise.
// ─────────────────────────────────────────────────────────────────────────────

interface PendingCommit {
  timer: ReturnType<typeof setTimeout>
  commit: () => Promise<void>
}

export function useBookingActions(vendorId: string | null) {
  const queryClient = useQueryClient()
  const snackbar = useSnackbar()
  const pending = useRef(new Map<string, PendingCommit>())

  // Patch every cached bookings page that holds this row, plus the detail cache.
  // Filtered lists are separate query keys, so a row approved from "Pending" has
  // to change in "All" too or the two views contradict each other.
  const patchCache = useCallback(
    (id: string, patch: Partial<Booking>) => {
      queryClient.setQueriesData<{ pages: { bookings: Booking[] }[] }>(
        { queryKey: ["bookings", vendorId ?? ""] },
        (old) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              bookings: page.bookings.map((b) =>
                b.id === id ? { ...b, ...patch } : b,
              ),
            })),
          }
        },
      )
      queryClient.setQueryData<Booking | null>(
        ["booking", vendorId ?? "", id],
        (old) => (old ? { ...old, ...patch } : old),
      )
    },
    [queryClient, vendorId],
  )

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["bookings", vendorId ?? ""] })
  }, [queryClient, vendorId])

  const handleFailure = useCallback(
    (error: unknown, id: string, revertTo: BookingStatus) => {
      patchCache(id, { status: revertTo })
      if (error instanceof StaleBookingError) {
        // B4: not a retryable failure. The row is genuinely out of date, so the
        // right move is to refresh and say so — "try again" would be a lie.
        snackbar.show({
          message: "This booking was already handled somewhere else.",
          tone: "error",
        })
        invalidate()
        return
      }
      snackbar.show({
        message: "Couldn't save that change. Check your connection.",
        tone: "error",
        actionLabel: "Retry",
        onAction: invalidate,
      })
    },
    [patchCache, snackbar, invalidate],
  )

  // Sends any approval still inside its undo window. Called when the app leaves
  // the foreground and on unmount — otherwise closing the app within 4 seconds
  // of tapping Approve would silently discard it.
  const flush = useCallback(async () => {
    const entries = Array.from(pending.current.entries())
    pending.current.clear()
    await Promise.all(
      entries.map(async ([, entry]) => {
        clearTimeout(entry.timer)
        await entry.commit()
      }),
    )
  }, [])

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") flush()
    })
    return () => {
      sub.remove()
      flush()
    }
  }, [flush])

  const approve = useCallback(
    (booking: Booking) => {
      if (pending.current.has(booking.id)) return

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      patchCache(booking.id, { status: "confirmed" })

      const commit = async () => {
        pending.current.delete(booking.id)
        try {
          await approveBooking(booking.id)
        } catch (error) {
          handleFailure(error, booking.id, "pending")
        }
      }

      const timer = setTimeout(commit, UNDO_WINDOW_MS)
      pending.current.set(booking.id, { timer, commit })

      snackbar.show({
        message: `Approved ${booking.bookerName || "booking"}`,
        actionLabel: "Undo",
        durationMs: UNDO_WINDOW_MS,
        onAction: () => {
          const entry = pending.current.get(booking.id)
          if (!entry) return // already committed; nothing to undo
          clearTimeout(entry.timer)
          pending.current.delete(booking.id)
          patchCache(booking.id, { status: "pending" })
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
      })
    },
    [patchCache, handleFailure, snackbar],
  )

  const reject = useCallback(
    async (booking: Booking, reason: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      patchCache(booking.id, { status: "cancelled", rejectionReason: reason })
      try {
        await rejectBooking(booking.id, reason)
        snackbar.show({ message: `Rejected ${booking.bookerName || "booking"}` })
      } catch (error) {
        handleFailure(error, booking.id, booking.status)
      }
    },
    [patchCache, handleFailure, snackbar],
  )

  /**
   * Run one fulfilment move.
   *
   * Written immediately, unlike `approve`. The deferred-commit machinery above
   * exists ONLY because `confirmed -> pending` is illegal, so an undo of approve
   * could never be sent as a compensating write. Every transition here is legal in
   * both directions the vendor can reach, so `undo` is just another forward write
   * — copying the timer would add a second cache-patch path for no benefit.
   */
  const fulfil = useCallback(
    async (booking: Booking, action: FulfilAction) => {
      const target = FULFIL_TARGET[action]

      // Capture BOTH fields before patching. Reverting `status` alone would leave
      // a failed action showing the new timestamp against the old status.
      const prevStatus = booking.status
      const prevChangedAt = booking.statusChangedAt

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      // ⚠️ `statusChangedAt` MUST be patched alongside `status`. It drives the
      // 3-day auto-confirm countdown, so patching status alone leaves the screen
      // counting down from the PREVIOUS transition — the same defect that shipped
      // in booker and then in vendor web (vendor web I23). The optimistic value is
      // approximate; the trigger sets the authoritative one and the next refetch
      // corrects it.
      patchCache(booking.id, {
        status: target,
        statusChangedAt: new Date().toISOString(),
      })

      try {
        await FULFIL_CALL[action](booking.id)
        snackbar.show({ message: FULFIL_DONE[action] })
        // The optimistic patch above already moved the row, but it cannot move a
        // COUNT — the filter-chip badges are server-side counts (they have to be:
        // this list is paged). Without this they would keep showing the pre-action
        // number until something else refetched. The patch supplies the instant
        // feedback; this reconciles everything derived from the set.
        invalidate()
      } catch (error) {
        patchCache(booking.id, {
          status: prevStatus,
          statusChangedAt: prevChangedAt,
        })
        // A stale row or a lost connection is reported by handleFailure; anything
        // else is a transition the DB refused, which on this screen means the
        // booking moved under us.
        if (error instanceof StaleBookingError) {
          handleFailure(error, booking.id, prevStatus)
          return
        }
        snackbar.show({
          message: FULFIL_ERROR[action],
          tone: "error",
          actionLabel: "Retry",
          onAction: invalidate,
        })
      }
    },
    [patchCache, snackbar, handleFailure, invalidate],
  )

  /**
   * Flag a booking for Ezzy to review.
   *
   * Not optimistic, unlike the other mutations. `raise_booking_dispute` can refuse
   * for reasons the client cannot predict — an open flag already exists, the
   * account is not active — and showing "On hold" before the server agrees would
   * tell a vendor their payout is frozen when it is not. The refetch is the
   * confirmation.
   */
  const flag = useCallback(
    async (booking: Booking, reason: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      try {
        await raiseDispute(booking.id, reason)
        patchCache(booking.id, {
          status: "disputed",
          statusChangedAt: new Date().toISOString(),
        })
        snackbar.show({ message: "Flagged for Ezzy to review" })
        invalidate()
      } catch (error) {
        // The RPC raises plain exceptions with vendor-readable text ("This
        // booking already has an open flag"), so surface the message rather than
        // a generic failure — it is more useful than anything written here.
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Couldn't flag this booking. Please try again."
        snackbar.show({ message, tone: "error" })
      }
    },
    [patchCache, snackbar, invalidate],
  )

  const isPending = useCallback((id: string) => pending.current.has(id), [])

  return { approve, reject, fulfil, flag, flush, isPending }
}
