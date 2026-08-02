import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { autoConfirmInfo } from "./autoConfirm.ts"
import type { BookingStatus } from "./types.ts"

const NOW = new Date("2026-08-02T00:00:00Z")
const iso = (d: string) => d

const bk = (
  status: BookingStatus,
  statusChangedAt: string | null,
  bookedDate = "2026-07-01",
) => ({ status, statusChangedAt, bookedDate })

describe("autoConfirmInfo — which states have a timer at all", () => {
  it("gives in_progress NO timer", () => {
    // The item is with the customer; only they can say it came back. Showing a
    // countdown here would promise a completion that never comes.
    const info = autoConfirmInfo(bk("in_progress", iso("2026-08-01T00:00:00Z")), NOW)
    assert.equal(info.dueAt, null)
    assert.equal(info.daysLeft, null)
  })

  it("gives no timer to any settled or pre-fulfilment state", () => {
    for (const status of [
      "pending",
      "confirmed",
      "completed",
      "disputed",
      "cancelled",
      "refunded",
    ] as BookingStatus[]) {
      assert.equal(
        autoConfirmInfo(bk(status, iso("2026-08-01T00:00:00Z")), NOW).dueAt,
        null,
        `${status} must have no countdown`,
      )
    }
  })

  it("treats a null status_changed_at as never due", () => {
    // Matches the SQL: `null < now() - interval '3 days'` is never true.
    assert.equal(autoConfirmInfo(bk("fulfilled", null), NOW).dueAt, null)
  })
})

describe("autoConfirmInfo — the 3-day window", () => {
  it("counts three days from the transition for `returned`", () => {
    const info = autoConfirmInfo(bk("returned", iso("2026-08-02T00:00:00Z")), NOW)
    assert.equal(info.daysLeft, 3)
    assert.equal(info.waitingForServiceDate, false)
  })

  it("counts down as time passes", () => {
    const info = autoConfirmInfo(
      bk("returned", iso("2026-07-31T00:00:00Z")),
      NOW,
    )
    assert.equal(info.daysLeft, 1)
  })

  it("floors at zero rather than going negative once overdue", () => {
    // The cron runs hourly, so a booking can sit past due. "-2 days" would read
    // as a bug to the vendor.
    const info = autoConfirmInfo(
      bk("returned", iso("2026-07-20T00:00:00Z")),
      NOW,
    )
    assert.equal(info.daysLeft, 0)
  })

  it("rounds UP, so the countdown never shows 0 while still waiting", () => {
    // Changed at 12:00 on the 1st, so due 12:00 on the 4th — 2.5 days from NOW.
    // Flooring would print "2" and then "0" while the booking still waits;
    // ceiling keeps the number honest until the moment it is actually due.
    const info = autoConfirmInfo(
      bk("returned", iso("2026-08-01T12:00:00Z")),
      NOW,
    )
    assert.equal(info.daysLeft, 3)
  })
})

describe("autoConfirmInfo — the service-date gate (20260801000009)", () => {
  it("does NOT let a session booking auto-confirm before its service date", () => {
    // The exploit this closes: mark a booking done weeks early, let the timer
    // release the payout for work that has not happened. A naive "3 days"
    // countdown here would tell the vendor something the database will refuse.
    const info = autoConfirmInfo(
      bk("fulfilled", iso("2026-08-01T00:00:00Z"), "2026-09-15"),
      NOW,
    )
    assert.equal(info.waitingForServiceDate, true)
    // Due at the START of the service day in Manila, not 3 days from now.
    assert.equal(info.dueAt?.toISOString(), "2026-09-14T16:00:00.000Z")
    assert.ok(info.daysLeft !== null && info.daysLeft > 3)
  })

  it("uses the 3-day window once the service date has passed", () => {
    const info = autoConfirmInfo(
      bk("fulfilled", iso("2026-08-01T00:00:00Z"), "2026-07-01"),
      NOW,
    )
    assert.equal(info.waitingForServiceDate, false)
    assert.equal(info.daysLeft, 2)
  })

  it("EXEMPTS `returned` from the gate — the booker's word is evidence", () => {
    // Reaching `returned` required the customer to state the item came back, so
    // the date gate does not apply even for a future service date.
    const info = autoConfirmInfo(
      bk("returned", iso("2026-08-01T00:00:00Z"), "2026-09-15"),
      NOW,
    )
    assert.equal(info.waitingForServiceDate, false)
    assert.equal(info.daysLeft, 2)
  })

  it("treats the service date as a Manila day boundary, not UTC", () => {
    // 00:00 Manila on 2026-09-15 is 16:00 UTC on the 14th. Using the UTC day
    // would be 8 hours out — wrong only near midnight, the worst kind to debug.
    const info = autoConfirmInfo(
      bk("fulfilled", iso("2026-08-01T00:00:00Z"), "2026-09-15"),
      NOW,
    )
    assert.equal(info.dueAt?.toISOString(), "2026-09-14T16:00:00.000Z")
  })
})
