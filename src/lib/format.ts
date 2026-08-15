// Formatting and payout rules copied from `vendor/lib/utils.ts`. Only the helpers
// this app needs are carried over — `cn`, the calendar builders and the category
// colour helpers belong to web-only surfaces.
//
// These are copied rather than depended on so the PH-timezone semantics cannot
// drift between clients; a change to either side must be mirrored. Hand-rolling
// them with `Intl` is also why no date library is installed (plan §6).

import type { BookingStatus, PayoutStatus } from "./types"

// Human labels for the nine booking statuses, ported verbatim from
// `vendor/lib/utils.ts` STATUS_LABEL so both clients name a state identically.
//
// DB values are snake_case and several are meaningless to a vendor on their own —
// "returned", by whom, to whom? — so nothing may render `booking.status` raw.
// Before this existed, three surfaces capitalised the column and displayed
// "In_progress".
//
// Note `returned` is "Confirm return", NOT "Got it back". "Got it back" is the
// BUTTON (bookingActionCopy `vendor_confirm_return`); the pill states where the
// booking is, the button states what tapping it does. `architecture/booking-flow.md`
// tabulates the action per party, which is a different question from the label.
const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  fulfilled: "Awaiting customer",
  in_progress: "With customer",
  returned: "Confirm return",
  completed: "Completed",
  disputed: "On hold",
  cancelled: "Cancelled",
  refunded: "Refunded",
}

/** Display name for a booking status. Falls back to the raw value so an unknown
 *  status from a newer migration degrades to something readable rather than blank. */
export function statusLabel(s: BookingStatus): string {
  return STATUS_LABEL[s] ?? s
}

// Whether the vendor is actually owed this money.
//
// SINGLE SOURCE OF TRUTH — used by both the payout totals and the per-row
// strikethrough. Defining it in two places lets the list and the summary drift
// apart and contradict each other on screen.
//
// ⚠️ Keyed on the LEDGER's payout_status, never on the booking status. Mirrors
// `vendor/lib/utils.ts:124-133`, whose warning applies verbatim: the database is
// authoritative and knows things the status alone does not — a payout already
// released before a later refund stays `released`, because the money genuinely
// left. Deriving this from BookingStatus is the bug the whole dual-acknowledgement
// feature existed to remove: it counted `confirmed` (i.e. undelivered work) as
// money owed.
const PAYABLE_BY_PAYOUT: Record<PayoutStatus, boolean> = {
  held: false, // not yet mutually completed
  releasable: true, // both parties acknowledged — owed
  released: true, // already disbursed — still the vendor's money
  reversed: false, // the vendor will not be paid this
}

export function isPayable(payoutStatus: PayoutStatus): boolean {
  return PAYABLE_BY_PAYOUT[payoutStatus] ?? false
}

// Why a payout is not counted, or null when it is. Lives beside PAYABLE_BY_PAYOUT
// so the explanation can't drift from the rule it explains.
//
// The distinction matters on screen: a `held` payout is "not yet", while
// `reversed` is "not ever". Both render struck through, so without this the two
// read as the same verdict.
//
// ⚠️ `reversed` is never described as refunded. The DB column comment is explicit:
// it means the vendor's payout was cancelled and says nothing about whether the
// booker got their money back — this system has no refund mechanism.
export function payoutExclusionReason(payoutStatus: PayoutStatus): string | null {
  if (isPayable(payoutStatus)) return null
  return payoutStatus === "held"
    ? "Not counted yet — released once you and the customer both confirm the booking is complete"
    : "Not counted — this payout was reversed"
}

// `decimals` defaults to 2 for line items; summary cards pass 0, where centavos
// are noise. One formatter so currency rendering can't drift between surfaces.
export function fmtPeso(n: number, decimals: 0 | 2 = 2): string {
  return `₱ ${n.toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

// Philippine calendar date (YYYY-MM-DD) for a timestamptz.
//
// Transaction timestamps are stored as timestamptz (UTC-backed) but the platform
// is PH-facing, so the day a payment "belongs to" is its Asia/Manila date — not
// its UTC date. A payment at 07:00 PH is 23:00 UTC the PREVIOUS day, so comparing
// raw UTC dates would file it under the wrong day and skew date-range payout
// totals. en-CA is used because it formats as YYYY-MM-DD, which keeps the result
// safe to compare lexicographically against a date filter value.
//
// On mobile this matters twice over: the DEVICE timezone is whatever the vendor
// is standing in, so anything date-related must go through here rather than
// through a bare `new Date()` (D2-A's "today" and "this month" stats included).
export function toPhDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
}

// Display form of the same PH date, e.g. "23 Jul 2026".
export function fmtPhDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "Asia/Manila",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function fmtRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  const weeks = Math.floor(diff / 604_800_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return `${weeks}w ago`
}

// Today's date in Manila, as YYYY-MM-DD. The web dashboard hard-codes a date
// literal here (`DashboardPage.tsx:21`) — D2-A computes it instead, and it must be
// the PH date rather than the device's local one.
export function phToday(): string {
  return toPhDate(new Date().toISOString())
}

// First and last PH calendar day of the month containing `day`, inclusive — the
// range behind D2-A's "Completed This Month" and "Monthly Revenue" stats.
//
// `day` defaults to today in Manila, which is every production caller. It is a
// parameter so the preset table in `dateWindows.ts` can be computed against ONE
// reference day: resolving "today" separately per preset would let a strip built
// across midnight mix two days, and it would make the whole table untestable.
export function phCurrentMonthRange(today: string = phToday()): { from: string; to: string } {
  const [year, month] = today.split("-").map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const mm = String(month).padStart(2, "0")
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  }
}

/**
 * When a booking actually happens, in the shape its offering is booked by.
 *
 * ⚠️ Reads the BOOKING's own span, never the schedule's window. The schedule can
 * be edited after a booking is sold, and — since 20260803000003 — several
 * bookings of one schedule occupy different slots. Rendering the schedule's
 * `start_time` here showed every booking of a schedule the same time, which is
 * the defect B8 removed across all three clients.
 *
 * Time-granular: "09:00 – 11:00".  Date-granular: "10 Aug – 12 Aug 2026".
 * Falls back to the bare date when a booking carries neither, which is what a
 * pre-migration row looks like.
 */
export function fmtBookingSpan(b: {
  bookedDate: string
  startTime: string
  endTime: string
  endDate: string
}): string {
  if (b.startTime) {
    return b.endTime ? `${b.startTime} – ${b.endTime}` : b.startTime
  }
  if (b.endDate && b.endDate !== b.bookedDate) {
    return `${fmtPhDate(b.bookedDate)} – ${fmtPhDate(b.endDate)}`
  }
  return fmtPhDate(b.bookedDate)
}

/** How many days a date-granular booking covers, inclusive. 0 when not date-granular. */
export function bookingDayCount(b: { bookedDate: string; endDate: string }): number {
  if (!b.endDate) return 0
  const ms = new Date(b.endDate + "T00:00:00Z").getTime() - new Date(b.bookedDate + "T00:00:00Z").getTime()
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}
