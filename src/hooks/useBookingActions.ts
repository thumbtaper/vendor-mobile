import { useQueryClient } from "@tanstack/react-query"
import * as Haptics from "expo-haptics"
import { useCallback, useEffect, useRef } from "react"
import { AppState } from "react-native"

import type { Booking, BookingStatus } from "@/lib/types"
import { useSnackbar } from "@/providers/SnackbarProvider"
import {
  approveBooking,
  rejectBooking,
  StaleBookingError,
} from "@/services/bookings.service"

const UNDO_WINDOW_MS = 4000

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

  const isPending = useCallback((id: string) => pending.current.has(id), [])

  return { approve, reject, flush, isPending }
}
