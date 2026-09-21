/*
 * How much of a schedule is still bookable on a given day.
 *
 * ⚠️ THE COUNTING RULE MUST MATCH `check_booking_placement()` (20260803000005),
 * which is what actually refuses a booking. It counts by **overlap**, not by
 * equality on start time — a 2-unit booking occupies its second slot too. A panel
 * that counts by equality under-counts, tells the vendor a slot is free, and the
 * database then rejects the booking. Wrong in the direction that wastes a sale.
 *
 * Own module, not `utils.ts`, because it is unit-tested: `node --test` has no
 * bundler, so anything it loads must resolve without the `@/` alias.
 */
import type { Schedule } from "./types.ts"
import { isDateGranular } from "./duration.ts"
import { deriveSlots, fitsInWindow, toHHMM, toMinutes } from "./slots.ts"

/**
 * The only fields availability counting reads.
 *
 * Narrow on purpose: the kiosk fetches its own rows and should not have to build a
 * full `Booking` — with a booker name, price and fulfilment pattern it will never
 * look at — just to ask how full a slot is. A full `Booking` satisfies this
 * structurally, so every existing caller is unaffected.
 */
export interface SlotBooking {
  scheduleId: string
  bookedDate: string
  startTime: string
  endTime: string
  endDate: string
  status: string
}

/** Statuses that still hold a space. Mirrors the trigger's list. */
const HOLDS_A_SPACE = (b: SlotBooking) => b.status !== "cancelled" && b.status !== "refunded"

/**
 * The real instant `minutes` past midnight on `dateStr`.
 *
 * `minutes` may exceed 1440, and that is the point: `"24:00"` is a legitimate end
 * time, and a slot that has wrapped past midnight is carried as an offset from its
 * window start rather than as a smaller clock time. Date arithmetic absorbs both.
 * Clock arithmetic is what wraps and silently loses the day.
 */
function instantAt(dateStr: string, minutes: number): number {
  // Calendar arithmetic, independent of the device's timezone/DST. These are
  // comparison coordinates, not actual UTC booking timestamps.
  return Date.parse(`${dateStr}T00:00:00Z`) + minutes * 60_000
}

/**
 * A derived slot's real start instant.
 *
 * ⚠️ Built from the WINDOW START plus the slot's offset — never from the slot's own
 * clock time. The 00:00 slot of a 23:00 window reads as an *earlier* clock time than
 * the window it belongs to, so taking it at face value files it a day early. The
 * offset already carries the day.
 */
export function slotInstant(
  occurrenceDate: string,
  windowStart: string,
  slotStart: string,
): number {
  let offset = toMinutes(slotStart) - toMinutes(windowStart)
  if (offset < 0) offset += 1440
  return instantAt(occurrenceDate, toMinutes(windowStart) + offset)
}

/**
 * The calendar date a derived slot is stored under — its `bookings.booked_date`.
 *
 * For a same-day window this is `occurrenceDate`. For the post-midnight half of an
 * overnight window it is the day after, because `booked_date` is the date a booking
 * STARTS (20260828000001). Anything writing a booking row must use this, not the
 * date the customer tapped.
 */
export function slotDate(
  occurrenceDate: string,
  windowStart: string,
  slotStart: string,
): string {
  const d = new Date(slotInstant(occurrenceDate, windowStart, slotStart))
  return ymd(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/** A booking's real occupied interval. Returns null when it has no time of day. */
function bookingInstants(b: SlotBooking): { from: number; to: number } | null {
  if (!b.startTime || !b.endTime) return null
  return {
    from: instantAt(b.bookedDate, toMinutes(b.startTime)),
    // `end_time` may be "24:00" — 1440 minutes, which date arithmetic resolves to
    // 00:00 the following day. Read as a clock time it would collapse to 00:00 on
    // the SAME day and invert the interval, making the booking occupy nothing.
    to: instantAt(b.endDate || b.bookedDate, toMinutes(b.endTime)),
  }
}

export interface SlotAvailability {
  /** "09:00" — absent for a date-granular schedule, which has no time of day. */
  start: string | null
  /** "10:00" — absent for the same reason. */
  end: string | null
  taken: number
  capacity: number
  remaining: number
}

/** "YYYY-MM-DD" for a calendar cell, in local terms — never via toISOString(). */
export function ymd(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/**
 * Per-slot availability for one schedule on one date.
 *
 * Date-granular schedules have no slots, so they return a single entry covering
 * the whole date — which is exactly how the database treats them.
 */
export function availabilityForDay(
  schedule: Schedule,
  bookings: SlotBooking[],
  dateStr: string,
): SlotAvailability[] {
  const mine = bookings.filter(b => b.scheduleId === schedule.id && HOLDS_A_SPACE(b))

  if (isDateGranular(schedule.durationUnit) || !schedule.time || !schedule.windowMinutes) {
    // A date-granular booking spans booked_date..end_date inclusive, so a booking
    // that STARTED days earlier still occupies this date. Equality on booked_date
    // would miss exactly those.
    const taken = mine.filter(b =>
      b.bookedDate <= dateStr && (b.endDate || b.bookedDate) >= dateStr,
    ).length
    return [{
      start: null, end: null, taken,
      capacity: schedule.max, remaining: Math.max(0, schedule.max - taken),
    }]
  }

  // ⚠️ NOT `bookedDate === dateStr`, and NOT minutes-from-midnight.
  //
  // A booking of a post-midnight slot is stored under the FOLLOWING date —
  // `booked_date` is the date a booking STARTS (20260828000001) — so an equality
  // filter drops exactly those, and every post-midnight slot of an overnight window
  // reads as free however many bookings it holds. Comparing clock minutes fails the
  // same way from the other side: 00:30 is not "before" 23:00 on any clock, but it
  // is 90 minutes later in real time.
  //
  // Both go away by comparing real instants. See B19 in
  // .plans/2026-08-26-vendor-kiosk-mode-and-offering-attachments.md.
  const windowStart = schedule.time
  const occupied = mine
    .map(bookingInstants)
    .filter((i): i is { from: number; to: number } => i !== null)

  return deriveSlots(windowStart, schedule.windowMinutes, schedule.durationMinutes)
    .starts.map(start => {
      const from = slotInstant(dateStr, windowStart, start)
      const to = from + schedule.durationMinutes * 60_000
      // Overlap, not equality — see the header.
      const taken = occupied.filter(i => i.from < to && i.to > from).length
      return {
        start,
        end: toMinutes(start) + schedule.durationMinutes >= 1440
          ? "24:00"
          : slotEnd(start, schedule.durationMinutes),
        taken,
        capacity: schedule.max,
        remaining: Math.max(0, schedule.max - taken),
      }
    })
}

function slotEnd(start: string, durationMinutes: number): string {
  const m = toMinutes(start) + durationMinutes
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

/**
 * Whether `quantity` consecutive units starting at `slotStart` are all bookable.
 *
 * ⚠️ Every covered slot must have room, not just the first. `check_booking_placement()`
 * takes the WORST covered slot, so a UI that checked only the start would offer a span
 * the database then refuses — with the customer already at the payment step.
 *
 * Two independent questions, and both have to hold: does the span fit inside the
 * window at all (`fitsInWindow`, which owns the midnight wrap), and is every slot it
 * covers still free (`availabilityForDay`, which owns the counting). Neither answers
 * the other.
 */
export function spanAvailable(
  schedule: Schedule,
  bookings: SlotBooking[],
  dateStr: string,
  slotStart: string,
  quantity: number,
): boolean {
  if (!Number.isInteger(quantity) || quantity < 1) return false
  if (isDateGranular(schedule.durationUnit) || !schedule.time || !schedule.windowMinutes) return false
  if (!fitsInWindow(slotStart, schedule.time, schedule.windowMinutes, schedule.durationMinutes, quantity)) {
    return false
  }

  const slots = availabilityForDay(schedule, bookings, dateStr)
  const startMin = toMinutes(slotStart)
  for (let i = 0; i < quantity; i++) {
    // `% 1440` so a covered slot past midnight is looked up by the clock time it is
    // actually listed under — the same wrap `deriveSlots` applied when building them.
    const at = toHHMM((startMin + i * schedule.durationMinutes) % 1440)
    const covered = slots.find(s => s.start === at)
    if (!covered || covered.remaining < 1) return false
  }
  return true
}
