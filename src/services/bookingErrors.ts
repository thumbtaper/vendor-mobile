// Error classification extracted from `bookings.service.ts` for unit testing (I7).
// This is B4's whole mechanism, so it is worth testing in isolation: get it wrong
// and a stale approval shows "try again", which is actively false — retrying
// fails identically because the row really was already handled.

// The message raised by `validate_booking_status_transition`
// (backbone/…/20260516000004_booking_status_transition.sql):
//   raise exception 'Invalid booking status transition: % → %'
const STALE_TRANSITION_MARKER = "Invalid booking status transition"

export class StaleBookingError extends Error {
  constructor() {
    super("This booking was already handled somewhere else.")
    this.name = "StaleBookingError"
  }
}

// Returns the error to throw, or null when there was none.
export function classifyBookingError(
  error: { message?: string } | null | undefined,
): Error | null {
  if (!error) return null
  if (error.message?.includes(STALE_TRANSITION_MARKER)) {
    return new StaleBookingError()
  }
  return error instanceof Error ? error : new Error(error.message ?? "Unknown error")
}
