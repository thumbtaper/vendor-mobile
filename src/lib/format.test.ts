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
  statusLabel,
  toPhDate,
} from "./format.ts"

describe("statusLabel — no vendor ever sees a raw column value", () => {
  it("names all nine statuses in human words", () => {
    const expected: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      fulfilled: "Awaiting customer",
      in_progress: "With customer",
      returned: "Confirm return",
      completed: "Completed",
      disputed: "On hold",
      cancelled: "Cancelled",
      refunded: "Refunded",
    }
    for (const [status, label] of Object.entries(expected)) {
      assert.equal(statusLabel(status as Parameters<typeof statusLabel>[0]), label)
    }
  })

  it("never leaks snake_case to the screen", () => {
    // Three surfaces used to capitalise the column directly and render
    // "In_progress". Underscores are the tell.
    for (const status of ["in_progress", "fulfilled", "returned", "disputed"]) {
      const label = statusLabel(status as Parameters<typeof statusLabel>[0])
      assert.doesNotMatch(label, /_/, `"${status}" rendered as "${label}"`)
    }
  })

  it("labels `returned` as the STATE, not as the button", () => {
    // "Got it back" is the button (bookingActionCopy.vendor_confirm_return); the
    // pill says where the booking is. Conflating them would put a call to action
    // in a read-only badge.
    assert.equal(statusLabel("returned"), "Confirm return")
    assert.notEqual(statusLabel("returned"), "Got it back")
  })

  it("falls back to the raw value for an unrecognised status", () => {
    // A newer migration can emit a status this binary predates — better a raw
    // word than an empty pill.
    const unknown = "teleported" as Parameters<typeof statusLabel>[0]
    assert.equal(statusLabel(unknown), "teleported")
  })
})

describe("isPayable — the payout rule, keyed on payout_status", () => {
  // These assertions previously read `isPayable("confirmed") === true`, encoding
  // the defect the dual-acknowledgement feature exists to remove: a confirmed
  // booking is work the vendor has NOT yet delivered.
  it("counts releasable and released", () => {
    assert.equal(isPayable("releasable"), true)
    assert.equal(isPayable("released"), true)
  })

  it("excludes held — paid by the booker, but not yet mutually confirmed", () => {
    assert.equal(isPayable("held"), false)
  })

  it("excludes reversed", () => {
    assert.equal(isPayable("reversed"), false)
  })

  it("REGRESSION: a booking status must never read as payable", () => {
    // The old rule was keyed on BookingStatus, so `confirmed` returned true and
    // vendors saw money for undelivered work. Nothing in the payout vocabulary
    // shares a name with a booking status, so these must all fall through to
    // false rather than matching a key by accident.
    for (const stale of ["confirmed", "completed", "pending", "cancelled", "refunded"]) {
      assert.equal(
        isPayable(stale as unknown as Parameters<typeof isPayable>[0]),
        false,
        `booking status "${stale}" must not be payable`,
      )
    }
  })
})

describe("payoutExclusionReason — 'not yet' vs 'not ever'", () => {
  it("returns null when the payout counts", () => {
    assert.equal(payoutExclusionReason("releasable"), null)
    assert.equal(payoutExclusionReason("released"), null)
  })

  it("distinguishes held from reversed", () => {
    // Both render struck through, so without distinct copy they read as the
    // same verdict to the vendor.
    const held = payoutExclusionReason("held")
    const reversed = payoutExclusionReason("reversed")
    assert.match(held!, /Not counted yet/)
    assert.match(reversed!, /reversed/)
    assert.notEqual(held, reversed)
  })

  it("never calls a reversed payout a refund", () => {
    // The DB column comment is explicit: `reversed` means the vendor will not be
    // paid, and says nothing about whether the booker got their money back —
    // this system has no refund mechanism at all.
    assert.doesNotMatch(payoutExclusionReason("reversed")!, /refund/i)
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
