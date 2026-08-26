// Bookings filter groups — ported from `vendor/lib/utils.ts:60-75`.
//
// That file's own comment asks for this port by name:
//
//   "Exported (not inlined in BookingsPage) because ezzy-vendor-mobile's
//    booking filter UI needs the same grouping and a second copy would drift."
//
// Copied rather than imported — separate repos, no shared build tooling. So the
// drift that comment warns about is prevented by discipline, not by the compiler:
// **edit web and mobile in the same change.**
//
// Why groups instead of one chip per status: there are nine statuses. One chip
// each would be ten controls in a strip that already felt full at five, and most
// would show near-zero counts. The bar groups by WHAT THE VENDOR MUST DO.
//
// Tradeoff, accepted deliberately and inherited from web: this removes
// single-status filtering. The one that could be missed is `in_progress` ("what
// is out right now"), which sits inside "Active". Do NOT solve that by adding a
// seventh chip — the strip is the constrained resource. Add a secondary control
// within the group instead.

import type { BookingStatus } from "./types"

export type BookingFilterKey =
  | "all"
  | "needs_you"
  | "active"
  | "done"
  | "issues"
  | "closed"

export interface BookingFilterGroup {
  key: BookingFilterKey
  label: string
  /** Empty means NO filter, not "match nothing" — see `bookingMatchesFilter`
   *  and the `.in()` guard in `bookings.service.ts`. */
  statuses: BookingStatus[]
}

export const BOOKING_FILTERS: readonly BookingFilterGroup[] = [
  { key: "all", label: "All", statuses: [] },
  { key: "needs_you", label: "Needs you", statuses: ["pending", "returned"] },
  {
    key: "active",
    label: "Active",
    statuses: ["confirmed", "fulfilled", "in_progress"],
  },
  { key: "done", label: "Done", statuses: ["completed"] },
  { key: "issues", label: "Issues", statuses: ["disputed"] },
  { key: "closed", label: "Closed", statuses: ["cancelled", "refunded"] },
]

/**
 * Which chips carry a count badge.
 *
 * Only the two that represent WORK. Badging every group would turn the strip into
 * noise and bury the two that matter — the same restraint the web portal shows
 * (`vendor/.../useBookings.ts` badges exactly these). "Done" and "Closed" are
 * history; a number on them tells the vendor nothing they need to act on.
 */
export const BADGED_FILTERS: BookingFilterKey[] = ["needs_you", "issues"]

const BY_KEY = new Map(BOOKING_FILTERS.map((f) => [f.key, f]))

/**
 * The statuses a filter selects. An EMPTY array means "no filter" — the caller
 * must not pass it to PostgREST's `.in()`, which would match zero rows. The
 * service guards on `length > 0` for exactly this reason.
 */
export function statusesForFilter(key: BookingFilterKey): BookingStatus[] {
  return BY_KEY.get(key)?.statuses ?? []
}

/** Client-side equivalent of the server filter, for anything already in memory. */
export function bookingMatchesFilter(
  status: BookingStatus,
  key: BookingFilterKey,
): boolean {
  if (key === "all") return true
  const group = BY_KEY.get(key)
  return group ? group.statuses.includes(status) : true
}
