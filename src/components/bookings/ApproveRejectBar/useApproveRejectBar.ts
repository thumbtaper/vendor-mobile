import { useCallback, useState } from "react"

import type { Booking } from "@/lib/types"

// The one interactive booking component (plan §4). Owns only the sheet's
// open/closed state — the mutations themselves belong to `useBookingActions`,
// which the screen passes in, so this component depends on function signatures
// rather than on the data layer.
export function useApproveRejectBar(
  booking: Booking,
  onApprove: (booking: Booking) => void,
  onReject: (booking: Booking, reason: string) => Promise<void>,
) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const approve = useCallback(() => onApprove(booking), [onApprove, booking])
  const openSheet = useCallback(() => setSheetOpen(true), [])
  const closeSheet = useCallback(() => setSheetOpen(false), [])

  const confirmReject = useCallback(
    (reason: string) => onReject(booking, reason),
    [onReject, booking],
  )

  return { sheetOpen, approve, openSheet, closeSheet, confirmReject }
}
