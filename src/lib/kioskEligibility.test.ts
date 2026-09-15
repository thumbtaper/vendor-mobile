// Run with: npm test
//
// The exclusions here are correctness rules, not presentation. A date-granular
// offering reaching the kiosk grid leads a customer to a picker they cannot finish.

import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { classifyKioskOfferings, exclusionLabel } from "./kioskEligibility.ts"
import type { Offering, Schedule } from "./types.ts"

const off = (over: Partial<Offering> = {}): Offering => ({
  id: "o1", name: "Court Rental", code: "RENT", category: "Rental", description: "",
  price: 850, durationMinutes: 60, durationUnit: "hour", status: "active",
  requirements: [], staffIds: [], fulfilmentPattern: "session", ...over,
} as Offering)

const sch = (offeringId: string): Schedule => ({
  id: "s-" + offeringId, offeringId, offeringName: "", category: "Rental", title: "",
  date: "2026-08-10", endDate: null, time: "09:00", windowMinutes: 180, end: "12:00",
  days: [], repeat: "none", instId: null, max: 2,
  durationMinutes: 60, durationUnit: "hour",
} as Schedule)

describe("classifyKioskOfferings", () => {
  it("includes an hourly offering that has an active schedule", () => {
    const r = classifyKioskOfferings([off()], [sch("o1")])
    assert.deepEqual(r.eligible.map(o => o.id), ["o1"])
    assert.equal(r.excluded.length, 0)
  })

  it("excludes a date-granular offering even when it has a schedule", () => {
    // D7: the booker cannot complete this mode, so the kiosk must not offer it.
    const dayPass = off({ id: "o2", durationUnit: "day", durationMinutes: 1440 })
    const r = classifyKioskOfferings([dayPass], [sch("o2")])
    assert.equal(r.eligible.length, 0)
    assert.deepEqual(r.excluded, [{ offering: dayPass, reason: "date_granular" }])
  })

  it("excludes an hourly offering with no active schedule", () => {
    const r = classifyKioskOfferings([off()], [])
    assert.equal(r.eligible.length, 0)
    assert.equal(r.excluded[0].reason, "no_schedule")
  })

  it("reports date_granular in preference to no_schedule", () => {
    // The vendor can fix "no schedule" by adding one; they cannot fix "priced per
    // day" that way, so that is the more useful thing to be told.
    const dayPass = off({ id: "o3", durationUnit: "week", durationMinutes: 10080 })
    const r = classifyKioskOfferings([dayPass], [])
    assert.equal(r.excluded[0].reason, "date_granular")
  })

  it("keeps custody offerings — they are sellable since the close-out path exists", () => {
    // D2. Before 20260829000003/4 a custody booking could not be completed at all.
    const rental = off({ id: "o4", fulfilmentPattern: "custody" })
    const r = classifyKioskOfferings([rental], [sch("o4")])
    assert.deepEqual(r.eligible.map(o => o.id), ["o4"])
  })

  it("splits a mixed catalogue and preserves input order", () => {
    const a = off({ id: "a" })
    const b = off({ id: "b", durationUnit: "day" })
    const c = off({ id: "c" })
    const r = classifyKioskOfferings([a, b, c], [sch("a")])
    assert.deepEqual(r.eligible.map(o => o.id), ["a"])
    assert.deepEqual(r.excluded.map(x => x.offering.id), ["b", "c"])
  })

  it("handles an empty catalogue", () => {
    const r = classifyKioskOfferings([], [])
    assert.deepEqual(r, { eligible: [], excluded: [] })
  })
})

describe("exclusionLabel", () => {
  it("gives the vendor a reason they can act on", () => {
    assert.match(exclusionLabel("no_schedule"), /schedule/)
    assert.match(exclusionLabel("date_granular"), /day/)
  })
})
