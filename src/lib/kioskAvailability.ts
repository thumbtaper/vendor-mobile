import { isOccurrence, parseLocalDate } from "./occurrence.ts"
import { availabilityForDay, slotDate, type SlotBooking } from "./slotAvailability.ts"
import type { Schedule } from "./types.ts"

const PH_UTC_OFFSET = "+08:00"

export interface FreeSlot {
  scheduleId: string
  ownDate: string
  start: string
  remaining: number
}

export interface OfferingAvailability {
  firstDate: string | null
  nextStart: string | null
  freeCount: number
  bookedOutToday: boolean
}

export function hasStarted(ownDate: string, start: string, nowMs: number): boolean {
  const at = Date.parse(`${ownDate}T${start.slice(0, 5)}:00${PH_UTC_OFFSET}`)
  return !Number.isNaN(at) && at <= nowMs
}

export function freeSlotsOn(
  schedules: Schedule[], bookings: SlotBooking[], date: string, nowMs: number,
): { free: FreeSlot[]; upcoming: number } {
  const day = parseLocalDate(date)
  const free: FreeSlot[] = []
  let upcoming = 0
  for (const schedule of schedules) {
    if (!schedule.time || !isOccurrence(schedule, day)) continue
    for (const slot of availabilityForDay(schedule, bookings, date)) {
      if (!slot.start) continue
      const ownDate = slotDate(date, schedule.time, slot.start)
      if (hasStarted(ownDate, slot.start, nowMs)) continue
      upcoming += 1
      if (slot.remaining > 0) free.push({ scheduleId: schedule.id, ownDate, start: slot.start, remaining: slot.remaining })
    }
  }
  free.sort((a, b) => `${a.ownDate}${a.start}`.localeCompare(`${b.ownDate}${b.start}`))
  return { free, upcoming }
}

export function offeringAvailability(
  schedules: Schedule[], bookings: SlotBooking[], dates: string[], nowMs: number,
): OfferingAvailability {
  let bookedOutToday = false
  for (let index = 0; index < dates.length; index += 1) {
    const result = freeSlotsOn(schedules, bookings, dates[index], nowMs)
    if (index === 0 && result.upcoming > 0 && result.free.length === 0) bookedOutToday = true
    if (result.free.length > 0) {
      return { firstDate: dates[index], nextStart: result.free[0].start, freeCount: result.free.length, bookedOutToday }
    }
  }
  return { firstDate: null, nextStart: null, freeCount: 0, bookedOutToday }
}

export function whenAvailable(firstDate: string | null, dates: string[]): string | null {
  if (!firstDate) return null
  const index = dates.indexOf(firstDate)
  if (index < 0) return null
  if (index === 0) return "today"
  if (index === 1) return "tomorrow"
  return `on ${parseLocalDate(firstDate).toLocaleDateString("en-US", { weekday: "long" })}`
}

export function longDayLabel(date: string): string {
  const day = parseLocalDate(date)
  const weekday = day.toLocaleDateString("en-US", { weekday: "long" })
  const month = day.toLocaleDateString("en-US", { month: "short" })
  return `${weekday} ${day.getDate()} ${month}`
}

export type AvailabilityGroup = "today" | "later" | "none"

export function groupByAvailability<T extends { id: string }>(
  items: T[], availability: Map<string, OfferingAvailability>, today: string,
): Record<AvailabilityGroup, T[]> {
  const result: Record<AvailabilityGroup, T[]> = { today: [], later: [], none: [] }
  for (const item of items) {
    const current = availability.get(item.id)
    if (!current?.firstDate) result.none.push(item)
    else if (current.firstDate === today) result.today.push(item)
    else result.later.push(item)
  }
  const key = (item: T) => {
    const current = availability.get(item.id)
    return `${current?.firstDate ?? ""}${current?.nextStart ?? ""}`
  }
  result.today.sort((a, b) => key(a).localeCompare(key(b)))
  result.later.sort((a, b) => key(a).localeCompare(key(b)))
  return result
}
