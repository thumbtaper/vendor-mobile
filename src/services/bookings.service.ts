// Adapted from `vendor/services/bookings.service.ts`. Two differences, both
// forced by the platform rather than chosen:
//
//  1. Bookings are fetched a page at a time (`range`) for infinite scroll,
//     instead of the web's fetch-everything. Numbered pagination is a desktop
//     affordance (plan §5.2).
//  2. Booker contacts are a SEPARATE call rather than a parallel fetch merged in
//     the service. The contacts RPC returns every contact for the vendor, so
//     re-running it per page would be pure waste; the query hook fetches it once
//     and merges. profiles RLS still blocks a direct join — the RPC is the only
//     way to read booker name/email/phone as a vendor-admin.

import { supabase } from "@/lib/supabase/client"
import type { Booking, BookingStatus, FulfilmentPattern } from "@/lib/types"
import { classifyBookingError } from "./bookingErrors"

export { StaleBookingError } from "./bookingErrors"

export const BOOKINGS_PAGE_SIZE = 20

type BookingRow = {
  id: string
  booker_id: string
  booked_date: string
  status: string
  price_paid: number
  notes: string | null
  rejection_reason: string
  fulfilment_pattern: string
  is_paid: boolean
  status_changed_at: string | null
  offerings: { name: string; code: string } | null
  schedules: { start_time: string } | null
}

// One definition for both the list and the detail query. They were byte-identical
// duplicates before this gained three more columns; two copies of a growing column
// list is a drift waiting to happen, and the sibling `transactions.service.ts`
// already uses exactly this pattern.
const BOOKING_SELECT_COLS = `
  id, booker_id, booked_date, status, price_paid, notes, rejection_reason,
  fulfilment_pattern, is_paid, status_changed_at,
  offerings(name, code),
  schedules(start_time)
`

export interface BookerContact {
  booker_id: string
  full_name: string
  email: string
  phone: string
}

export interface BookingsPage {
  bookings: Booking[]
  /** Page index to request next, or null when the end has been reached. */
  nextPage: number | null
}

function toBooking(row: BookingRow, contact: BookerContact | undefined): Booking {
  return {
    id: row.id,
    bookerId: row.booker_id,
    bookerName: contact?.full_name ?? "",
    bookerEmail: contact?.email ?? "",
    bookerPhone: contact?.phone ?? "",
    offeringName: row.offerings?.name ?? "",
    offeringCode: row.offerings?.code ?? "",
    bookedDate: row.booked_date,
    startTime: row.schedules?.start_time ?? "",
    status: row.status as BookingStatus,
    pricePaid: row.price_paid,
    notes: row.notes ?? "",
    rejectionReason: row.rejection_reason ?? "",
    // Both columns are `not null` in the schema; the fallbacks cover only a row
    // fetched by some future query that forgets to select them. `session` is the
    // DB's own default, so it is the honest choice rather than a guess.
    fulfilmentPattern: (row.fulfilment_pattern ?? "session") as FulfilmentPattern,
    isPaid: row.is_paid ?? false,
    // Genuinely nullable — see the note on Booking.statusChangedAt.
    statusChangedAt: row.status_changed_at ?? null,
  }
}

export async function getBookerContacts(
  vendorId: string,
): Promise<Map<string, BookerContact>> {
  const { data, error } = await supabase.rpc("get_booker_contacts", {
    p_vendor_id: vendorId,
  })
  if (error) throw error
  const contacts = (data as BookerContact[] | null) ?? []
  return new Map(contacts.map((c) => [c.booker_id, c]))
}

/**
 * One page of bookings.
 *
 * `statuses` is a LIST because the filter chips group statuses by what the vendor
 * must do (see `lib/bookingFilters.ts`); an empty list means no status filter at
 * all. The service takes statuses rather than a filter key on purpose — the
 * grouping is a UI concern and does not belong behind the data layer.
 */
export async function getBookingsPage(
  vendorId: string,
  page: number,
  statuses: BookingStatus[],
  contacts: Map<string, BookerContact>,
): Promise<BookingsPage> {
  const from = page * BOOKINGS_PAGE_SIZE
  const to = from + BOOKINGS_PAGE_SIZE - 1

  let query = supabase
    .from("bookings")
    .select(BOOKING_SELECT_COLS)
    .eq("vendor_id", vendorId)
    // Matches the web's ordering. `id` is the tiebreaker: without it, rows
    // sharing a created_at can swap between pages and appear twice or not at all.
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to)

  // ⚠️ Empty means "no filter", NOT "match nothing". Handing `[]` to PostgREST's
  // `.in()` produces `status=in.()`, which matches zero rows — the "All" chip
  // would render an empty list. The guard is the whole reason this is not a
  // one-liner.
  if (statuses.length > 0) query = query.in("status", statuses)

  const { data, error } = await query
  if (error) throw error

  const rows = (data as unknown as BookingRow[]) ?? []
  return {
    bookings: rows.map((row) => toBooking(row, contacts.get(row.booker_id))),
    nextPage: rows.length === BOOKINGS_PAGE_SIZE ? page + 1 : null,
  }
}

/**
 * How many bookings this vendor has in the given statuses.
 *
 * `head: true` with `count: "exact"` — the badge needs a number, not rows, and
 * asking for rows here would defeat the point of paging the list.
 *
 * A COUNT QUERY IS NECESSARY, not laziness: the web portal derives its badges by
 * filtering an in-memory array, because it fetches every booking. This app fetches
 * one page at a time for infinite scroll, so counting what is loaded would report
 * "3 need you" when the truth is 30 — and under-reporting work waiting on the
 * vendor is the worst direction to be wrong in.
 */
export async function countBookingsWithStatuses(
  vendorId: string,
  statuses: BookingStatus[],
): Promise<number> {
  if (statuses.length === 0) return 0

  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
    .in("status", statuses)

  if (error) throw error
  return count ?? 0
}

export async function getBookingById(
  vendorId: string,
  id: string,
  contacts: Map<string, BookerContact>,
): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT_COLS)
    .eq("vendor_id", vendorId)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as BookingRow
  return toBooking(row, contacts.get(row.booker_id))
}

// Classification lives in `bookingErrors.ts` so B4's rule is unit-testable
// without a Supabase client (I7).
function rethrow(error: { message?: string } | null): never | void {
  const classified = classifyBookingError(error)
  if (classified) throw classified
}

export async function approveBooking(id: string): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", id)
  rethrow(error)
}

// The four vendor-side fulfilment moves. Each is a plain status write — the
// database decides whether it is legal, via the actor-aware
// `validate_booking_status_transition` trigger (20260801000002). The client
// deliberately does NOT re-implement that rule: a second copy could disagree with
// the authority, and the failure mode of disagreeing is offering a vendor a button
// that always errors.
//
// Which move is offered for a given booking is decided in `useBookingActionBar`
// from (status, fulfilmentPattern) — same split as the web portal.
async function setStatus(id: string, status: BookingStatus): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
  rethrow(error)
}

/** session: the vendor performed it; the booker is asked to confirm. */
export async function markFulfilled(id: string): Promise<void> {
  await setStatus(id, "fulfilled")
}

/** custody: handed over; it is with the customer until they return it. */
export async function startCustody(id: string): Promise<void> {
  await setStatus(id, "in_progress")
}

/** custody: the vendor confirms it came back. Last step — releases the payout. */
export async function confirmReturn(id: string): Promise<void> {
  await setStatus(id, "completed")
}

/**
 * Step back to `confirmed`.
 *
 * Legal in the DB from `fulfilled` and `in_progress`, which is why this is a plain
 * forward write and NOT the deferred-commit trick `approve` uses — that exists
 * only because `confirmed -> pending` is rejected. See the note in
 * `useBookingActions`.
 */
export async function undoFulfilment(id: string): Promise<void> {
  await setStatus(id, "confirmed")
}

/**
 * Flag a booking for Ezzy to review, freezing the vendor's payout.
 *
 * Goes through the RPC rather than writing `status = 'disputed'` directly: the
 * function inserts the `booking_disputes` row AND moves the booking in one
 * transaction, so the flag and the frozen payout can never disagree. It also
 * derives `raised_role` server-side — the client never asserts who it is.
 *
 * Server-side rules worth knowing here, because each surfaces as a raw exception
 * if the client lets it through: the reason must be **≥ 10 characters trimmed**,
 * the caller must be the booker or a vendor-admin, and a booking may hold only one
 * open flag at a time.
 */
export async function raiseDispute(id: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("raise_booking_dispute", {
    p_booking_id: id,
    p_reason: reason,
  })
  if (error) throw error
}

export async function rejectBooking(id: string, reason: string): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      rejection_reason: reason,
      cancelled_by: user.id,
    })
    .eq("id", id)
  rethrow(error)
}
