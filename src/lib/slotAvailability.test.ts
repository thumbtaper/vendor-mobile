// Run with: npm test
//
// The counting rule here must match check_booking_placement(). The failure that
// matters is UNDER-counting: it tells the vendor a slot is free, and the database
// then refuses the booking.

import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { availabilityForDay, slotDate, spanAvailable, ymd } from "./slotAvailability.ts"
import type { Schedule } from "./types.ts"

import type { SlotBooking as Booking } from "./slotAvailability.ts"

const sched = (over: Partial<Schedule> = {}): Schedule => ({
  id: "s1", offeringId: "o1", offeringName: "", category: "Rental", title: "",
  date: "2026-08-10", endDate: null, time: "09:00", windowMinutes: 180, end: "12:00",
  days: [], repeat: "none", instId: null, max: 2,
  durationMinutes: 60, durationUnit: "hour", ...over,
} as Schedule)

const bk = (over: Partial<Booking> = {}): Booking => ({
  id: Math.random().toString(), bookerId: "b", scheduleId: "s1", bookerName: "",
  bookerEmail: "", bookerPhone: "", offeringName: "", offeringCode: "",
  bookedDate: "2026-08-10", startTime: "09:00", endTime: "10:00", endDate: "",
  status: "confirmed", pricePaid: 0, notes: "", rejectionReason: "",
  fulfilmentPattern: "session", statusChangedAt: null, isPaid: true, ...over,
} as Booking)

const DAY = "2026-08-10"

describe("availabilityForDay — time-granular", () => {
  it("derives one entry per slot, not one per schedule", () => {
    // 09:00-12:00 at 60min is three slots. The pre-slot model would have said one.
    const slots = availabilityForDay(sched(), [], DAY)
    assert.deepEqual(slots.map(s => s.start), ["09:00", "10:00", "11:00"])
    assert.deepEqual(slots.map(s => s.end), ["10:00", "11:00", "12:00"])
  })

  it("counts only the slot a booking actually occupies", () => {
    const slots = availabilityForDay(sched(), [bk({ startTime: "10:00", endTime: "11:00" })], DAY)
    assert.deepEqual(slots.map(s => s.remaining), [2, 1, 2])
  })

  it("counts a MULTI-UNIT booking against every slot it covers", () => {
    // The defect this guards: equality on start_time would decrement 09:00 only,
    // leaving 10:00 looking free when the DB will refuse it.
    const slots = availabilityForDay(sched(), [bk({ startTime: "09:00", endTime: "11:00" })], DAY)
    assert.deepEqual(slots.map(s => s.remaining), [1, 1, 2])
  })

  it("reports Full when capacity is exhausted, never negative", () => {
    const two = [bk(), bk()]
    const slots = availabilityForDay(sched(), two, DAY)
    assert.equal(slots[0].remaining, 0)
    assert.equal(slots[0].taken, 2)
  })

  it("ignores cancelled and refunded bookings", () => {
    const dead = [bk({ status: "cancelled" }), bk({ status: "refunded" })]
    assert.equal(availabilityForDay(sched(), dead, DAY)[0].remaining, 2)
  })

  it("ignores bookings on another date or another schedule", () => {
    const other = [bk({ bookedDate: "2026-08-11" }), bk({ scheduleId: "s2" })]
    assert.equal(availabilityForDay(sched(), other, DAY)[0].remaining, 2)
  })
})

describe("availabilityForDay — date-granular", () => {
  const gear = sched({
    time: null, windowMinutes: null, end: null, durationMinutes: 1440, durationUnit: "day",
    date: "2026-08-01", endDate: "2026-08-31", max: 1,
  })

  it("returns a single entry for the date, with no times", () => {
    const slots = availabilityForDay(gear, [], DAY)
    assert.equal(slots.length, 1)
    assert.equal(slots[0].start, null)
  })

  it("counts a SPANNING booking that started days earlier", () => {
    // Equality on booked_date would miss this entirely — the booking starts on the
    // 8th and still occupies the 10th.
    const spanning = [bk({ bookedDate: "2026-08-08", endDate: "2026-08-12", startTime: "", endTime: "" })]
    assert.equal(availabilityForDay(gear, spanning, DAY)[0].remaining, 0)
  })

  it("does not count a span that ends before this date", () => {
    const past = [bk({ bookedDate: "2026-08-01", endDate: "2026-08-05", startTime: "", endTime: "" })]
    assert.equal(availabilityForDay(gear, past, DAY)[0].remaining, 1)
  })
})

describe("ymd", () => {
  it("builds a local date string without timezone drift", () => {
    // toISOString() would shift this a day west of UTC.
    assert.equal(ymd(2026, 7, 10), "2026-08-10")
    assert.equal(ymd(2026, 0, 1), "2026-01-01")
  })
})

// ── Overnight windows (B19) ──────────────────────────────────────────────────
//
// These are the cases the single-date filter got wrong. A booking of a
// post-midnight slot is stored under the FOLLOWING date, so counting by
// `bookedDate === dateStr` dropped it and reported the slot as free.

const overnight = () => sched({ time: "23:00", windowMinutes: 120, end: "01:00" })

describe("availabilityForDay — windows that cross midnight", () => {
  it("derives both slots, the second past midnight", () => {
    assert.deepEqual(
      availabilityForDay(overnight(), [], DAY).map(s => s.start),
      ["23:00", "00:00"],
    )
  })

  it("counts a post-midnight booking stored under the NEXT date", () => {
    // The regression this whole item exists for: booked_date is the date a booking
    // STARTS, so the 00:00 slot of a Mon 23:00 window is filed under Tue.
    const slots = availabilityForDay(overnight(), [
      bk({ bookedDate: "2026-08-11", startTime: "00:00", endTime: "01:00" }),
    ], DAY)
    assert.deepEqual(slots.map(s => s.start), ["23:00", "00:00"])
    assert.deepEqual(slots.map(s => s.remaining), [2, 1],
      "the 00:00 slot must show one space taken, not two free")
  })

  it("does not let a post-midnight booking bleed into the pre-midnight slot", () => {
    const slots = availabilityForDay(overnight(), [
      bk({ bookedDate: "2026-08-11", startTime: "00:00", endTime: "01:00" }),
    ], DAY)
    assert.equal(slots[0].remaining, 2)
  })

  it("counts a booking that spans the midnight boundary against both slots", () => {
    const slots = availabilityForDay(overnight(), [
      bk({ bookedDate: DAY, startTime: "23:00", endTime: "01:00", endDate: "2026-08-11" }),
    ], DAY)
    assert.deepEqual(slots.map(s => s.remaining), [1, 1])
  })

  it("ignores a booking on an unrelated date", () => {
    const slots = availabilityForDay(overnight(), [
      bk({ bookedDate: "2026-09-01", startTime: "00:00", endTime: "01:00" }),
    ], DAY)
    assert.deepEqual(slots.map(s => s.remaining), [2, 2])
  })

  it('handles an end_time of "24:00" without inverting the interval', () => {
    // 23:00-24:00 is a real stored value. Read as a clock time it collapses to
    // 00:00 on the same day, making the booking occupy nothing.
    const slots = availabilityForDay(overnight(), [
      bk({ bookedDate: DAY, startTime: "23:00", endTime: "24:00" }),
    ], DAY)
    assert.equal(slots[0].remaining, 1, "the 23:00 slot must be counted as taken")
  })
})

describe("availabilityForDay — 24-hour windows", () => {
  it("derives 24 hourly slots and wraps the last back to 23:00", () => {
    const s = availabilityForDay(sched({ time: "00:00", windowMinutes: 1440, end: "24:00" }), [], DAY)
    assert.equal(s.length, 24)
    assert.equal(s[0].start, "00:00")
    assert.equal(s[23].start, "23:00")
  })

  it("counts a booking in the final hour of a 24-hour window", () => {
    const s = availabilityForDay(sched({ time: "00:00", windowMinutes: 1440, end: "24:00" }), [
      bk({ bookedDate: DAY, startTime: "23:00", endTime: "24:00" }),
    ], DAY)
    assert.equal(s[23].remaining, 1)
  })
})

// ── slotDate — which date a slot is stored under ─────────────────────────────
describe("slotDate", () => {
  it("returns the occurrence date for a same-day slot", () => {
    assert.equal(slotDate(DAY, "09:00", "10:00"), DAY)
  })

  it("returns the FOLLOWING date for a post-midnight slot", () => {
    // Anything writing a booking row must use this, not the date the customer tapped.
    assert.equal(slotDate(DAY, "23:00", "00:00"), "2026-08-11")
  })
})

// ── spanAvailable — multi-unit bookings ──────────────────────────────────────
describe("spanAvailable", () => {
  it("allows a span when every covered slot is free", () => {
    assert.equal(spanAvailable(sched(), [], DAY, "09:00", 3), true)
  })

  it("refuses a span that runs past the end of the window", () => {
    assert.equal(spanAvailable(sched(), [], DAY, "11:00", 2), false)
  })

  it("refuses when a LATER covered slot is full, not just the first", () => {
    // The likely wrong implementation checks only the start slot. The trigger takes
    // the worst covered slot, so that version offers a span the database refuses.
    const full = [
      bk({ startTime: "10:00", endTime: "11:00" }),
      bk({ startTime: "10:00", endTime: "11:00" }),
    ]
    assert.equal(spanAvailable(sched(), full, DAY, "10:00", 1), false, "start slot is full")
    assert.equal(spanAvailable(sched(), full, DAY, "09:00", 1), true, "start slot alone is free")
    assert.equal(spanAvailable(sched(), full, DAY, "09:00", 2), false,
      "the second covered slot is full — the span must be refused")
  })

  it("spans midnight, looking up the covered slot by its wrapped clock time", () => {
    assert.equal(spanAvailable(overnight(), [], DAY, "23:00", 2), true)
  })

  it("refuses a midnight-spanning span when the post-midnight half is taken", () => {
    const taken = [
      bk({ bookedDate: "2026-08-11", startTime: "00:00", endTime: "01:00" }),
      bk({ bookedDate: "2026-08-11", startTime: "00:00", endTime: "01:00" }),
    ]
    assert.equal(spanAvailable(overnight(), taken, DAY, "23:00", 2), false)
  })

  it("refuses a date-granular schedule, which has no slots to span", () => {
    const dg = sched({ time: null, windowMinutes: null, end: null, durationMinutes: 1440, durationUnit: "day" })
    assert.equal(spanAvailable(dg, [], DAY, "09:00", 1), false)
  })

  it("refuses a quantity below one", () => {
    assert.equal(spanAvailable(sched(), [], DAY, "09:00", 0), false)
  })
})
