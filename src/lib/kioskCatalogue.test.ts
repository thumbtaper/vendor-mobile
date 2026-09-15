import assert from "node:assert/strict"
import { test } from "node:test"
import { addCalendarDays, kioskDateChoices, kioskMaxQuantity, kioskSlots, occurringSchedules } from "./kioskCatalogue.ts"
import { spanAvailable } from "./slotAvailability.ts"
import type { Schedule } from "./types.ts"

const schedule: Schedule = {
  id: "s1", offeringId: "o1", offeringName: "Court", category: "", title: "",
  date: "2026-09-12", endDate: null, time: "23:00", windowMinutes: 180,
  end: "02:00", days: [], repeat: "none", instId: null, max: 1,
  durationMinutes: 60, durationUnit: "hour",
}

test("seven calendar dates survive month/year boundaries", () => {
  const dates = kioskDateChoices("2026-12-29")
  assert.equal(dates.length, 7)
  assert.equal(dates[0].label, "Today")
  assert.equal(dates[1].label, "Tomorrow")
  assert.equal(dates[6].value, "2027-01-04")
  assert.equal(addCalendarDays("2028-02-28", 1), "2028-02-29")
})

test("post-midnight slots retain their own date and sort after the opening day", () => {
  const slots = kioskSlots([schedule], [], schedule.date)
  assert.deepEqual(slots.map(s => [s.start, s.ownDate, s.nextDay]), [
    ["23:00", "2026-09-12", false], ["00:00", "2026-09-13", true], ["01:00", "2026-09-13", true],
  ])
  assert.equal(kioskMaxQuantity(slots[0], [], schedule.date), 3)
  assert.equal(kioskMaxQuantity(slots[2], [], schedule.date), 1)
})

test("tomorrow's booking blocks every spanning quantity that overlaps it", () => {
  const bookings = [{ scheduleId: "s1", bookedDate: "2026-09-13", startTime: "00:00", endTime: "01:00", endDate: "", status: "confirmed" }]
  const slots = kioskSlots([schedule], bookings, schedule.date)
  assert.deepEqual(slots.map(s => s.remaining), [1, 0, 1])
  assert.equal(kioskMaxQuantity(slots[0], bookings, schedule.date), 1)
  assert.equal(kioskMaxQuantity(slots[1], bookings, schedule.date), 0)
  assert.equal(spanAvailable(schedule, bookings, schedule.date, "23:00", 1.5), false)
})

test("24-hour schedules have 24 hourly slots but quantity remains capped at 12", () => {
  const fullDay = { ...schedule, time: "00:00", windowMinutes: 1440, end: "24:00" }
  const slots = kioskSlots([fullDay], [], schedule.date)
  assert.equal(slots.length, 24)
  assert.equal(slots[23].start, "23:00")
  assert.ok(slots.every(s => !s.nextDay))
  assert.equal(kioskMaxQuantity(slots[0], [], schedule.date), 12)
})

test("occurrence selection respects offering and one-off date", () => {
  assert.deepEqual(occurringSchedules([schedule], "o1", "2026-09-12"), [schedule])
  assert.deepEqual(occurringSchedules([schedule], "o1", "2026-09-13"), [])
  assert.deepEqual(occurringSchedules([schedule], "other", "2026-09-12"), [])
})

test("device DST does not change the date of an overnight calendar slot", () => {
  const previous = process.env.TZ
  try {
    process.env.TZ = "America/Toronto"
    const slots = kioskSlots([schedule], [], "2026-11-01")
    assert.equal(slots[1].ownDate, "2026-11-02")
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
})
