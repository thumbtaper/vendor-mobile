// Run with: npm test
//
// Node's built-in test runner, deliberately: adding jest/vitest is a dependency
// approval gate (§6), and these are pure functions with no React Native imports,
// so they need no native runtime.

import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  fmtPeso,
  fmtPhDate,
  fmtRelativeTime,
  isPayable,
  payoutExclusionReason,
  phCurrentMonthRange,
  toPhDate,
} from "./format.ts"

describe("isPayable — the payout rule (I5)", () => {
  it("counts confirmed and completed", () => {
    assert.equal(isPayable("confirmed"), true)
    assert.equal(isPayable("completed"), true)
  })

  it("excludes pending — paid, but the vendor hasn't accepted yet", () => {
    assert.equal(isPayable("pending"), false)
  })

  it("excludes cancelled and refunded", () => {
    assert.equal(isPayable("cancelled"), false)
    assert.equal(isPayable("refunded"), false)
  })
})

describe("payoutExclusionReason — 'not yet' vs 'not ever'", () => {
  it("returns null when the payout counts", () => {
    assert.equal(payoutExclusionReason("confirmed"), null)
  })

  it("distinguishes pending from terminal exclusions", () => {
    // Both render struck through, so without distinct copy they read as the
    // same verdict to the vendor.
    const pending = payoutExclusionReason("pending")
    const cancelled = payoutExclusionReason("cancelled")
    assert.match(pending!, /Not counted yet/)
    assert.match(cancelled!, /was cancelled/)
    assert.notEqual(pending, cancelled)
  })
})

describe("toPhDate — the UTC day boundary (I7's named risk)", () => {
  it("files an early-morning PH payment under the PH day, not the UTC day", () => {
    // 2026-07-28 07:00 Manila is 2026-07-27 23:00 UTC. Using the UTC date would
    // file this payment a day early and skew date-range payout totals.
    assert.equal(toPhDate("2026-07-27T23:00:00Z"), "2026-07-28")
  })

  it("keeps a late-evening PH payment on the same PH day", () => {
    // 2026-07-28 23:00 Manila = 15:00 UTC same day.
    assert.equal(toPhDate("2026-07-28T15:00:00Z"), "2026-07-28")
  })

  it("handles the exact PH midnight boundary", () => {
    // 16:00 UTC is 00:00 the NEXT day in Manila (UTC+8).
    assert.equal(toPhDate("2026-07-27T16:00:00Z"), "2026-07-28")
    // One second earlier is still the previous PH day.
    assert.equal(toPhDate("2026-07-27T15:59:59Z"), "2026-07-27")
  })

  it("sorts lexicographically, which date-range filters rely on", () => {
    assert.ok(toPhDate("2026-07-27T16:00:00Z") > toPhDate("2026-07-26T16:00:00Z"))
  })
})

describe("fmtPhDate", () => {
  it("renders the PH calendar day in display form", () => {
    assert.equal(fmtPhDate("2026-07-27T23:00:00Z"), "28 Jul 2026")
  })
})

describe("phCurrentMonthRange", () => {
  it("spans the first to the last day of the same month", () => {
    const { from, to } = phCurrentMonthRange()
    assert.match(from, /^\d{4}-\d{2}-01$/)
    assert.equal(from.slice(0, 7), to.slice(0, 7))
    assert.ok(to >= from)
  })

  it("ends on a real last-day-of-month, not day 31 blindly", () => {
    const { to } = phCurrentMonthRange()
    const day = Number(to.slice(8))
    assert.ok(day >= 28 && day <= 31)
    // Round-trips through Date without rolling into the next month.
    const parsed = new Date(`${to}T00:00:00Z`)
    assert.equal(parsed.toISOString().slice(0, 10), to)
  })
})

describe("fmtPeso", () => {
  it("defaults to 2 decimals for line items", () => {
    assert.equal(fmtPeso(1234.5), "₱ 1,234.50")
  })

  it("drops centavos when asked, for summary cards", () => {
    assert.equal(fmtPeso(1234.5, 0), "₱ 1,235")
  })

  it("formats zero rather than blanking it", () => {
    assert.equal(fmtPeso(0, 0), "₱ 0")
  })
})

describe("fmtRelativeTime", () => {
  it("reports sub-minute as 'just now'", () => {
    assert.equal(fmtRelativeTime(new Date().toISOString()), "just now")
  })

  it("steps through minutes, hours, days and weeks", () => {
    const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
    assert.equal(fmtRelativeTime(ago(5 * 60_000)), "5m ago")
    assert.equal(fmtRelativeTime(ago(3 * 3_600_000)), "3h ago")
    assert.equal(fmtRelativeTime(ago(2 * 86_400_000)), "2d ago")
    assert.equal(fmtRelativeTime(ago(14 * 86_400_000)), "2w ago")
  })
})
