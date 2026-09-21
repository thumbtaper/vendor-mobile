import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { groupByAvailability, offeringAvailability, freeSlotsOn, hasStarted, whenAvailable } from "./kioskAvailability.ts"
import type { Offering, Schedule } from "./types.ts"

const schedule = (id: string, offeringId: string, date: string, time = "09:00"): Schedule => ({
  id, offeringId, offeringName: offeringId, category: "", title: "",
  date, endDate: null, time, windowMinutes: 180, end: "12:00", days: [], repeat: "none", instId: null,
  max: 1, durationMinutes: 60, durationUnit: "hour",
})

const offering = (id: string): Offering => ({
  id, name: id, code: id.toUpperCase(), description: "", price: 100,
  durationMinutes: 60, durationUnit: "hour", fulfilmentPattern: "session",
})

describe("kiosk availability grouping", () => {
  it("puts a free future slot today before a later date", () => {
    const dates = ["2026-09-17", "2026-09-18", "2026-09-19"]
    const now = Date.parse("2026-09-17T08:00:00+08:00")
    const today = offeringAvailability([schedule("s1", "today", dates[0])], [], dates, now)
    const later = offeringAvailability([schedule("s2", "later", dates[1])], [], dates, now)
    assert.equal(today.firstDate, dates[0])
    assert.equal(later.firstDate, dates[1])
    assert.equal(whenAvailable(later.firstDate, dates), "tomorrow")
  })

  it("distinguishes a fully booked today from no availability", () => {
    const date = "2026-09-17"
    const bookings = [
      { scheduleId: "s1", bookedDate: date, startTime: "09:00", endTime: "10:00", endDate: "", status: "confirmed" },
      { scheduleId: "s1", bookedDate: date, startTime: "10:00", endTime: "11:00", endDate: "", status: "confirmed" },
      { scheduleId: "s1", bookedDate: date, startTime: "11:00", endTime: "12:00", endDate: "", status: "confirmed" },
    ]
    const result = offeringAvailability([schedule("s1", "o1", date)], bookings, [date], Date.parse("2026-09-17T08:00:00+08:00"))
    assert.equal(result.firstDate, null)
    assert.equal(result.bookedOutToday, true)
    assert.deepEqual(freeSlotsOn([schedule("s1", "o1", date)], bookings, date, Date.parse("2026-09-17T08:00:00+08:00")).free, [])
  })

  it("orders groups by first date and keeps unavailable offerings separate", () => {
    const items = [offering("later"), offering("today"), offering("none")]
    const availability = new Map([
      ["later", { firstDate: "2026-09-18", nextStart: "09:00", freeCount: 1, bookedOutToday: false }],
      ["today", { firstDate: "2026-09-17", nextStart: "10:00", freeCount: 1, bookedOutToday: false }],
      ["none", { firstDate: null, nextStart: null, freeCount: 0, bookedOutToday: false }],
    ])
    const groups = groupByAvailability(items, availability, "2026-09-17")
    assert.deepEqual(groups.today.map(item => item.id), ["today"])
    assert.deepEqual(groups.later.map(item => item.id), ["later"])
    assert.deepEqual(groups.none.map(item => item.id), ["none"])
  })

  it("uses the Philippines offset when excluding started slots", () => {
    const now = Date.parse("2026-09-17T09:00:00+08:00")
    assert.equal(hasStarted("2026-09-17", "09:00", now), true)
    assert.equal(hasStarted("2026-09-17", "10:00", now), false)
  })
})
