// When — and whether — a booking will auto-confirm itself.
//
// This mirrors `auto_acknowledge_bookings()` (20260801000006, replaced by
// 20260801000009). It is displayed as a countdown next to a vendor's money, so it
// must not approximate: a countdown that expires without anything happening is
// worse than no countdown, because the vendor concludes the payout is stuck.
//
// The database promotes a booking when ALL of:
//   1. status is `fulfilled` or `returned`      — never `in_progress`
//   2. status_changed_at < now() - interval '3 days'
//   3. status = 'returned' OR booked_date <= today in Asia/Manila
//
// Condition 3 is the part an obvious implementation gets wrong. A vendor can mark
// a session done weeks before its service date (legitimately — early delivery by
// agreement), but the timer will NOT complete it until that date arrives. Showing
// "auto-confirms in 3 days" there would promise something the database will refuse
// to do for another three weeks. `returned` is exempt because reaching it required
// the BOOKER to say the item came back, which is direct evidence the booking
// happened; `fulfilled` is a unilateral vendor claim, so only it waits.

import type { Booking } from "./types"

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

// The Philippines is UTC+8 year-round with no DST, so a fixed offset is exact
// rather than an approximation. `booked_date` is a plain `date`, and the gate
// compares it against the Manila calendar day — so a booking becomes eligible at
// 00:00 Manila on its service date.
const PH_OFFSET = "+08:00"

export interface AutoConfirmInfo {
  /** When the timer will promote this booking, or null if it never will. */
  dueAt: Date | null
  /** Whole days remaining, floored at 0. Null when `dueAt` is null. */
  daysLeft: number | null
  /**
   * True when the service date — not the 3-day window — is what the booking is
   * waiting on. Worth saying out loud: the vendor has already acted, and the
   * delay is not their 3-day clock running slowly.
   */
  waitingForServiceDate: boolean
}

const NONE: AutoConfirmInfo = {
  dueAt: null,
  daysLeft: null,
  waitingForServiceDate: false,
}

export function autoConfirmInfo(
  booking: Pick<Booking, "status" | "statusChangedAt" | "bookedDate">,
  now: Date = new Date(),
): AutoConfirmInfo {
  const { status, statusChangedAt, bookedDate } = booking

  // `in_progress` has NO timer — the item is with the customer and only they can
  // say it came back. Every other state is either terminal or waiting on a person
  // rather than a clock.
  if (status !== "fulfilled" && status !== "returned") return NONE

  // The SQL reads `status_changed_at < now() - interval '3 days'`, and a NULL
  // never satisfies a comparison — so a row with no timestamp is never due. The
  // column is nullable (20260801000002 backfilled but did not enforce NOT NULL).
  if (!statusChangedAt) return NONE

  const changedAt = new Date(statusChangedAt)
  if (Number.isNaN(changedAt.getTime())) return NONE

  const windowDue = changedAt.getTime() + THREE_DAYS_MS

  let dueMs = windowDue
  let waitingForServiceDate = false

  if (status === "fulfilled") {
    const serviceDayStart = new Date(`${bookedDate}T00:00:00${PH_OFFSET}`).getTime()
    if (!Number.isNaN(serviceDayStart) && serviceDayStart > windowDue) {
      dueMs = serviceDayStart
      waitingForServiceDate = true
    }
  }

  const remaining = dueMs - now.getTime()
  return {
    dueAt: new Date(dueMs),
    // Ceil, not floor: with 1.2 days to go a vendor should read "2 days", not
    // "1" — rounding down would have the countdown hit zero while the booking is
    // still waiting.
    daysLeft: Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000))),
    waitingForServiceDate,
  }
}
