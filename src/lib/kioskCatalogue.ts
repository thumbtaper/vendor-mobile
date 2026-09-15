import { isOccurrence, parseLocalDate } from "./occurrence.ts"
import { availabilityForDay, slotDate, spanAvailable, type SlotBooking } from "./slotAvailability.ts"
import type { Schedule } from "./types.ts"

export function addCalendarDays(day: string, count: number): string {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

export function kioskDateChoices(today: string) {
  return Array.from({ length: 7 }, (_, index) => {
    const value = addCalendarDays(today, index)
    const date = new Date(`${value}T00:00:00Z`)
    return {
      value,
      label: index === 0 ? "Today" : index === 1 ? "Tomorrow" : date.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short" }),
      detail: date.toLocaleDateString("en-GB", { timeZone: "UTC", month: "short", day: "numeric" }),
    }
  })
}

export function occurringSchedules(schedules: Schedule[], offeringId: string, date: string) {
  return schedules.filter(s => s.offeringId === offeringId && isOccurrence(s, parseLocalDate(date)))
}

export interface KioskSlot {
  id: string
  start: string
  ownDate: string
  nextDay: boolean
  remaining: number
  schedule: Schedule
}

export function kioskSlots(schedules: Schedule[], bookings: SlotBooking[], date: string): KioskSlot[] {
  const slots: KioskSlot[] = []
  for (const schedule of schedules) {
    if (!schedule.time) continue
    for (const slot of availabilityForDay(schedule, bookings, date)) {
      if (!slot.start) continue
      const ownDate = slotDate(date, schedule.time, slot.start)
      slots.push({ id: `${schedule.id}:${ownDate}:${slot.start}`, start: slot.start,
        ownDate, nextDay: ownDate !== date, remaining: slot.remaining, schedule })
    }
  }
  return slots.sort((a, b) => `${a.ownDate}${a.start}${a.id}`.localeCompare(`${b.ownDate}${b.start}${b.id}`))
}

export function kioskMaxQuantity(slot: KioskSlot, bookings: SlotBooking[], occurrenceDate: string): number {
  let quantity = 0
  while (quantity < 12 && spanAvailable(slot.schedule, bookings, occurrenceDate, slot.start, quantity + 1)) quantity++
  return quantity
}
