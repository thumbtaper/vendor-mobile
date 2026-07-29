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
import type { Booking, BookingStatus } from "@/lib/types"
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
  offerings: { name: string; code: string } | null
  schedules: { start_time: string } | null
}

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

export async function getBookingsPage(
  vendorId: string,
  page: number,
  status: BookingStatus | "all",
  contacts: Map<string, BookerContact>,
): Promise<BookingsPage> {
  const from = page * BOOKINGS_PAGE_SIZE
  const to = from + BOOKINGS_PAGE_SIZE - 1

  let query = supabase
    .from("bookings")
    .select(
      `
        id, booker_id, booked_date, status, price_paid, notes, rejection_reason,
        offerings(name, code),
        schedules(start_time)
      `,
    )
    .eq("vendor_id", vendorId)
    // Matches the web's ordering. `id` is the tiebreaker: without it, rows
    // sharing a created_at can swap between pages and appear twice or not at all.
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to)

  if (status !== "all") query = query.eq("status", status)

  const { data, error } = await query
  if (error) throw error

  const rows = (data as unknown as BookingRow[]) ?? []
  return {
    bookings: rows.map((row) => toBooking(row, contacts.get(row.booker_id))),
    nextPage: rows.length === BOOKINGS_PAGE_SIZE ? page + 1 : null,
  }
}

export async function getBookingById(
  vendorId: string,
  id: string,
  contacts: Map<string, BookerContact>,
): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
        id, booker_id, booked_date, status, price_paid, notes, rejection_reason,
        offerings(name, code),
        schedules(start_time)
      `,
    )
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
