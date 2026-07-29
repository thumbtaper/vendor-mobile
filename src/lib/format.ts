// Formatting and payout rules copied from `vendor/lib/utils.ts`. Only the helpers
// this app needs are carried over — `cn`, the calendar builders and the category
// colour helpers belong to web-only surfaces.
//
// These are copied rather than depended on so the PH-timezone semantics cannot
// drift between clients; a change to either side must be mirrored. Hand-rolling
// them with `Intl` is also why no date library is installed (plan §6).

import type { BookingStatus } from "./types"

// Which booking statuses the vendor is actually owed money for.
//
// SINGLE SOURCE OF TRUTH — used by both the payout totals and the per-row
// strikethrough. Defining it in two places lets the list and the summary drift
// apart and contradict each other on screen.
//
// Exhaustive over BookingStatus on purpose: adding a status forces a decision here
// rather than silently defaulting to payable.
//
// `pending` is NOT payable: the booker pays at booking time, so a payment can land
// before the vendor has accepted the booking. Counting it would show money in
// "Total Payout" for work the vendor hasn't even agreed to yet — the same reason
// cancelled is excluded. It becomes payable the moment the booking is confirmed.
const PAYABLE_BY_STATUS: Record<BookingStatus, boolean> = {
  pending: false, // paid, but the vendor hasn't accepted the booking yet
  confirmed: true,
  completed: true,
  cancelled: false, // vendor cancelled — service not delivered
  refunded: false, // money returned to the booker
}

export function isPayable(status: BookingStatus): boolean {
  return PAYABLE_BY_STATUS[status] ?? false
}

// Why a payout is not counted, or null when it is. Lives beside PAYABLE_BY_STATUS
// so the explanation can't drift from the rule it explains.
//
// The distinction matters on screen: an excluded `pending` payout is "not yet",
// while cancelled/refunded is "not ever". Both render struck through, so without
// this the two read as the same verdict.
export function payoutExclusionReason(status: BookingStatus): string | null {
  if (isPayable(status)) return null
  return status === "pending"
    ? "Not counted yet — confirm the booking to include it in your payout"
    : `Not counted — this booking was ${status}`
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

// First and last PH calendar day of the current month, inclusive — the range
// behind D2-A's "Completed This Month" and "Monthly Revenue" stats.
export function phCurrentMonthRange(): { from: string; to: string } {
  const today = phToday()
  const [year, month] = today.split("-").map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const mm = String(month).padStart(2, "0")
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  }
}
