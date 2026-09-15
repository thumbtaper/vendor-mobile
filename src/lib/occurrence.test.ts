// Run with: npm test
//
// Node's built-in runner, no framework — the same zero-dependency choice
// `ezzy-vendor-mobile` already makes. `occurrence.ts` imports only a type, so it
// loads without React, Next or a Supabase client.
//
// These cases are the five defects the previous `getSchedsForDay` had, plus the
// agreement check against the booker's `isOccurrence`. A failure here is the
// early warning that the four copies of this rule have drifted.

import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { isOccurrence, parseLocalDate } from "./occurrence.ts"
import type { Schedule } from "./types.ts"

const base: Schedule = {
  id: "s1",
  offeringId: "o1",
  offeringName: "Court Rental",
  category: "Rental",
  title: "Morning",
  date: "2026-04-27",       // a Monday
  endDate: null,
  time: "09:00",
  windowMinutes: 480,
  end: "17:00",
  days: [0, 2, 4],           // Mon / Wed / Fri, DB encoding
  repeat: "weekly",
  instId: null,
  max: 1,
  durationMinutes: 60,
  durationUnit: "hour",
}

const on = (s: Schedule, ymd: string) => isOccurrence(s, parseLocalDate(ymd))

describe("isOccurrence — start and end bounds", () => {
  it("does not run before its start date", () => {
    // The headline defect: the old filter marked matching weekdays in EVERY
    // month, including months before the schedule existed.
    assert.equal(on(base, "2026-01-05"), false)  // a Monday, months early
    assert.equal(on(base, "2026-04-20"), false)  // the Monday before it starts
  })

  it("runs from its start date onwards", () => {
    assert.equal(on(base, "2026-04-27"), true)
    assert.equal(on(base, "2026-05-04"), true)
  })

  it("stops after end_date", () => {
    const bounded = { ...base, endDate: "2026-05-06" }
    assert.equal(on(bounded, "2026-05-04"), true)
    assert.equal(on(bounded, "2026-05-11"), false)
  })
})

describe("isOccurrence — recurrence frequency", () => {
  it("weekly runs on every listed weekday", () => {
    assert.equal(on(base, "2026-04-29"), true)   // Wed
    assert.equal(on(base, "2026-05-01"), true)   // Fri
    assert.equal(on(base, "2026-04-28"), false)  // Tue, not listed
  })

  it("biweekly skips the intervening week", () => {
    // The old filter treated this as weekly and marked both.
    const fortnightly = { ...base, repeat: "biweekly" as const }
    assert.equal(on(fortnightly, "2026-04-27"), true)   // week 0
    assert.equal(on(fortnightly, "2026-05-04"), false)  // week 1
    assert.equal(on(fortnightly, "2026-05-11"), true)   // week 2
  })

  it("monthly keeps the same week-of-month", () => {
    // 27 Apr is in the 4th week; only 4th-week Mondays qualify.
    const monthly = { ...base, repeat: "monthly" as const }
    assert.equal(on(monthly, "2026-04-27"), true)
    assert.equal(on(monthly, "2026-05-25"), true)   // also 4th week
    assert.equal(on(monthly, "2026-05-04"), false)  // 1st week
  })

  it("one-time runs on exactly its own date", () => {
    const once = { ...base, repeat: "none" as const, days: [] }
    assert.equal(on(once, "2026-04-27"), true)
    assert.equal(on(once, "2026-05-04"), false)
  })
})

describe("isOccurrence — date-granular schedules", () => {
  // NULL start_time is the discriminator; the DB guarantees it for day/week/month
  // offerings. The old filter left these marked on their start date only.
  const gear: Schedule = {
    ...base,
    time: null,
    windowMinutes: null,
    end: null,
    days: [],
    repeat: "none",
    date: "2026-04-01",
    endDate: "2026-12-31",
  }

  it("runs on every date inside its range, not just the first", () => {
    assert.equal(on(gear, "2026-04-01"), true)
    assert.equal(on(gear, "2026-07-15"), true)   // a Wednesday, mid-range
    assert.equal(on(gear, "2026-07-18"), true)   // a Saturday — weekday is irrelevant
    assert.equal(on(gear, "2026-12-31"), true)
  })

  it("respects both ends of the range", () => {
    assert.equal(on(gear, "2026-03-31"), false)
    assert.equal(on(gear, "2027-01-01"), false)
  })

  it("stays open-ended when end_date is null", () => {
    assert.equal(on({ ...gear, endDate: null }, "2030-01-01"), true)
  })
})

describe("isOccurrence — agreement with the booker", () => {
  // Ported verbatim from booker/services/schedules.service.ts so a divergence in
  // either copy fails here. If this breaks, do NOT patch one side — reconcile all
  // four, including check_booking_placement().
  function bookerIsOccurrence(
    s: { startDate: string; endDate: string | null; daysOfWeek: number[]; recurrence: string; dateGranular: boolean },
    date: Date,
  ): boolean {
    const startDate = parseLocalDate(s.startDate)
    if (date < startDate) return false
    if (s.endDate && date > parseLocalDate(s.endDate)) return false
    if (s.dateGranular) return true
    if (s.recurrence === "none") {
      return date.getFullYear() === startDate.getFullYear()
        && date.getMonth() === startDate.getMonth()
        && date.getDate() === startDate.getDate()
    }
    const jsDows = s.daysOfWeek.map(d => (d + 1) % 7)
    if (!jsDows.includes(date.getDay())) return false
    if (s.recurrence === "weekly") return true
    const monday = (d: Date) => {
      const x = new Date(d); x.setHours(0, 0, 0, 0)
      const dow = x.getDay(); x.setDate(x.getDate() - (dow === 0 ? 6 : dow - 1)); return x
    }
    const weeks = Math.round((monday(date).getTime() - monday(startDate).getTime()) / (7 * 86_400_000))
    if (s.recurrence === "biweekly") return weeks >= 0 && weeks % 2 === 0
    return Math.ceil(date.getDate() / 7) === Math.ceil(startDate.getDate() / 7)
  }

  it("agrees across a full year of dates, for every recurrence", () => {
    for (const repeat of ["none", "weekly", "biweekly", "monthly"] as const) {
      const mine = { ...base, repeat }
      const theirs = {
        startDate: base.date, endDate: base.endDate,
        daysOfWeek: base.days, recurrence: repeat, dateGranular: false,
      }
      for (let i = 0; i < 365; i++) {
        const d = parseLocalDate("2026-01-01")
        d.setDate(d.getDate() + i)
        assert.equal(
          isOccurrence(mine, d), bookerIsOccurrence(theirs, d),
          `${repeat} disagreed on ${d.toDateString()}`,
        )
      }
    }
  })
})

/*
 * The overnight fixture (overnight plan, B5).
 *
 * These assert that occurrence selection is UNCHANGED by a window running past
 * midnight — which is the whole claim of B5. A schedule whose window ends the next
 * day still occurs, and only occurs, on the weekdays it names.
 *
 * Note the deliberate asymmetry with `bookings.booked_date`, which is the date a
 * booking STARTS and so may be the Saturday: these two dates are different things
 * and only coincide for same-day windows. This file is about occurrences.
 */
describe("isOccurrence — overnight windows do not move the occurrence", () => {
  // Fridays 23:00, running two hours into Saturday.
  const overnight: Schedule = { ...base, date: "2026-05-01", days: [4], repeat: "weekly" }

  it("occurs on the Friday the window opens", () => {
    assert.equal(isOccurrence(overnight, parseLocalDate("2026-05-01")), true)  // Friday
    assert.equal(isOccurrence(overnight, parseLocalDate("2026-05-08")), true)  // next Friday
  })

  it("does NOT occur on the Saturday its slots spill into", () => {
    // The 00:00 and 01:00 slots are physically Saturday, and belong to FRIDAY.
    // Saturday is a separate day that this schedule does not run on.
    assert.equal(isOccurrence(overnight, parseLocalDate("2026-05-02")), false)
    assert.equal(isOccurrence(overnight, parseLocalDate("2026-05-09")), false)
  })

  it("still respects the start_date bound", () => {
    assert.equal(isOccurrence(overnight, parseLocalDate("2026-04-24")), false) // Friday, but before start
  })

  it("still respects the end_date bound on the date the window OPENS", () => {
    // Bounded to its own start date: the window may finish on 2026-05-02, and that
    // does not make 2026-05-02 an occurrence, nor invalidate 2026-05-01.
    const bounded: Schedule = { ...overnight, endDate: "2026-05-01" }
    assert.equal(isOccurrence(bounded, parseLocalDate("2026-05-01")), true)
    assert.equal(isOccurrence(bounded, parseLocalDate("2026-05-08")), false)
  })
})
