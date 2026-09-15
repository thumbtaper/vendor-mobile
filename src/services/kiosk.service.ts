import { supabase } from "@/lib/supabase/client"
import { classifyKioskOfferings } from "@/lib/kioskEligibility"
import { addCalendarDays } from "@/lib/kioskCatalogue"
import { fetchAllPages } from "@/lib/pagedFetch"
import { windowEnd } from "@/lib/slots"
import type { DurationUnit } from "@/lib/duration"
import type { SlotBooking } from "@/lib/slotAvailability"
import type { Offering, OfferingAttachment, Schedule } from "@/lib/types"

interface ReadPage {
  data: unknown[] | null
  count: number | null
  error: unknown
  status: number
}

async function readAll<T>(fetch: (from: number, to: number) => PromiseLike<ReadPage>): Promise<T[]> {
  const result = await fetchAllPages<T>(async (from, to) => {
    const page = await fetch(from, to)
    const error = !page.error ? null : page.status === 0
      ? "Cannot connect. Check the internet connection and retry."
      : page.status === 401 || page.status === 403
        ? "Staff access is required. Please see staff."
        : "Availability is temporarily unavailable. Please retry."
    return { rows: page.data as T[] | null, total: page.count, error }
  }, { pageSize: 200, maxRows: 20_000 })
  if (result.error) throw new Error(result.error.startsWith("Cannot connect") || result.error.startsWith("Staff access")
    ? result.error : "Availability is temporarily unavailable. Please retry.")
  if (!result.complete || result.total === null) throw new Error("Could not load all availability. Please retry.")
  return result.rows
}

interface OfferingRow {
  id: string; name: string; code: string; description: string; price: number
  duration_minutes: number; duration_unit: DurationUnit; fulfilment_pattern: Offering["fulfilmentPattern"]
}
interface ScheduleRow {
  id: string; title: string; offering_id: string; start_date: string; end_date: string | null
  start_time: string | null; window_minutes: number | null; days_of_week: number[] | null
  recurrence: Schedule["repeat"]; capacity_per_slot: number
}
interface AttachmentRow {
  id: string; offering_id: string; kind: OfferingAttachment["kind"]; title: string
  storage_path: string | null; body: string | null; version: number
  requires_signature: boolean; sort_order: number; is_active: boolean
}
interface BookingRow {
  schedule_id: string; booked_date: string; start_time: string | null
  end_time: string | null; end_date: string | null; status: string
}

/** Active read models only. Same RLS client as the staff app; never persisted. */
export async function getKioskCatalogue(vendorId: string) {
  const rows = await readAll<OfferingRow>((from, to) => supabase.from("offerings")
    .select("id, name, code, description, price, duration_minutes, duration_unit, fulfilment_pattern", { count: "exact" })
    .eq("vendor_id", vendorId).eq("is_active", true).order("id").range(from, to))
  const offerings: Offering[] = rows.map(r => ({ id: r.id, name: r.name, code: r.code,
    description: r.description, price: Number(r.price), durationMinutes: r.duration_minutes,
    durationUnit: r.duration_unit, fulfilmentPattern: r.fulfilment_pattern }))
  const byId = new Map(offerings.map(o => [o.id, o]))
  const rules = await readAll<ScheduleRow>((from, to) => supabase.from("schedules")
    .select("id, title, offering_id, start_date, end_date, start_time, window_minutes, days_of_week, recurrence, capacity_per_slot", { count: "exact" })
    .eq("vendor_id", vendorId).eq("is_active", true).order("id").range(from, to))
  const schedules: Schedule[] = rules.flatMap(r => {
    const offering = byId.get(r.offering_id)
    if (!offering) return []
    const time = r.start_time?.slice(0, 5) ?? null
    return [{ id: r.id, offeringId: r.offering_id, offeringName: offering.name, category: "", title: r.title,
      date: r.start_date, endDate: r.end_date, time, windowMinutes: r.window_minutes,
      end: time && r.window_minutes ? windowEnd(time, r.window_minutes) : null,
      days: r.days_of_week ?? [], repeat: r.recurrence, instId: null, max: r.capacity_per_slot,
      durationMinutes: offering.durationMinutes, durationUnit: offering.durationUnit }]
  })
  const attachments = await readAll<AttachmentRow>((from, to) => supabase.from("offering_attachments")
    .select("id, offering_id, kind, title, storage_path, body, version, requires_signature, sort_order, is_active, offerings!inner(vendor_id, is_active)", { count: "exact" })
    .eq("offerings.vendor_id", vendorId).eq("offerings.is_active", true).eq("is_active", true)
    .order("sort_order").order("id").range(from, to))
  const files = attachments.map(r => ({ id: r.id, offeringId: r.offering_id, kind: r.kind,
    title: r.title, storagePath: r.storage_path, body: r.body ?? "", version: r.version,
    requiresSignature: r.requires_signature, sortOrder: r.sort_order, isActive: r.is_active }))
  return { ...classifyKioskOfferings(offerings, schedules), schedules, attachments: files }
}

/** Query both calendar days of an occurrence; select no customer fields. */
export async function getKioskSlotBookings(vendorId: string, scheduleIds: string[], date: string): Promise<SlotBooking[]> {
  const out: SlotBooking[] = []
  // Keep PostgREST URLs bounded even for a vendor with many active rules.
  for (let offset = 0; offset < scheduleIds.length; offset += 50) {
    const rows = await readAll<BookingRow>((from, to) => supabase.from("bookings")
      .select("schedule_id, booked_date, start_time, end_time, end_date, status", { count: "exact" })
      .eq("vendor_id", vendorId).in("schedule_id", scheduleIds.slice(offset, offset + 50))
      .gte("booked_date", date).lte("booked_date", addCalendarDays(date, 1))
      .not("status", "in", "(cancelled,refunded)").order("id").range(from, to))
    out.push(...rows.map(r => ({ scheduleId: r.schedule_id, bookedDate: r.booked_date,
      startTime: r.start_time ?? "", endTime: r.end_time ?? "", endDate: r.end_date ?? "", status: r.status })))
  }
  return out
}

export function kioskPhotoUrl(attachment: OfferingAttachment): string | null {
  if (attachment.kind !== "photo" || !attachment.isActive || !attachment.storagePath) return null
  return supabase.storage.from("offering-photos").getPublicUrl(attachment.storagePath).data.publicUrl
}
