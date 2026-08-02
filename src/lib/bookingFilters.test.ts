import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  BADGED_FILTERS,
  BOOKING_FILTERS,
  bookingMatchesFilter,
  statusesForFilter,
} from "./bookingFilters.ts"
import type { BookingStatus } from "./types.ts"

// The nine statuses the database allows (20260801000002). Listed explicitly
// because a TypeScript union is not enumerable at runtime — this list IS the
// assertion, so adding a status to the union means adding it here too.
const ALL_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "fulfilled",
  "in_progress",
  "returned",
  "completed",
  "disputed",
  "cancelled",
  "refunded",
]

const GROUPS = BOOKING_FILTERS.filter((f) => f.key !== "all")

describe("BOOKING_FILTERS — every booking is reachable", () => {
  it("places all nine statuses in exactly one group", () => {
    // The point of the whole change: before it, four statuses had no chip and
    // were reachable only under "All". A status in NO group is invisible; a
    // status in TWO groups is worse — the same booking appears under two chips
    // and the vendor cannot tell which is authoritative.
    for (const status of ALL_STATUSES) {
      const owners = GROUPS.filter((g) => g.statuses.includes(status)).map(
        (g) => g.key,
      )
      assert.equal(
        owners.length,
        1,
        `"${status}" belongs to ${owners.length} groups: [${owners.join(", ")}]`,
      )
    }
  })

  it("groups no status the database cannot produce", () => {
    for (const group of GROUPS) {
      for (const status of group.statuses) {
        assert.ok(
          ALL_STATUSES.includes(status),
          `"${group.key}" references unknown status "${status}"`,
        )
      }
    }
  })

  it("keeps the strip at six chips", () => {
    // Not arbitrary: the strip is the constrained resource, and web's own note
    // says to add a secondary control inside a group rather than a seventh chip.
    assert.equal(BOOKING_FILTERS.length, 6)
  })

  it("puts the two states the vendor must act on under 'Needs you'", () => {
    const needsYou = statusesForFilter("needs_you")
    assert.deepEqual([...needsYou].sort(), ["pending", "returned"])
  })
})

describe("statusesForFilter — the empty-array contract", () => {
  it("returns [] for `all`, meaning NO filter", () => {
    // ⚠️ The caller must not hand this to PostgREST's `.in()`: `status=in.()`
    // matches zero rows, which would render "All" as an empty list. The guard
    // lives in bookings.service.ts.
    assert.deepEqual(statusesForFilter("all"), [])
  })

  it("returns [] for an unrecognised key rather than throwing", () => {
    const bogus = "not_a_group" as Parameters<typeof statusesForFilter>[0]
    assert.deepEqual(statusesForFilter(bogus), [])
  })
})

describe("bookingMatchesFilter — the in-memory equivalent", () => {
  it("matches everything under `all`", () => {
    for (const status of ALL_STATUSES) {
      assert.equal(bookingMatchesFilter(status, "all"), true)
    }
  })

  it("agrees with statusesForFilter for every group and status", () => {
    // The server filters with `.in(statusesForFilter(key))` and anything already
    // in memory is filtered with `bookingMatchesFilter`. If these two ever
    // disagree, a booking shows in the list and vanishes on refresh.
    for (const group of GROUPS) {
      for (const status of ALL_STATUSES) {
        assert.equal(
          bookingMatchesFilter(status, group.key),
          statusesForFilter(group.key).includes(status),
          `disagreement for ${status} under ${group.key}`,
        )
      }
    }
  })
})

describe("BADGED_FILTERS — only the chips that represent work", () => {
  it("badges exactly `needs_you` and `issues`", () => {
    // Badging every group turns the strip into noise and buries the two that
    // matter. "Done" and "Closed" are history — a number there is not actionable.
    // Matches what the web portal badges.
    assert.deepEqual([...BADGED_FILTERS].sort(), ["issues", "needs_you"])
  })

  it("badges only real filter keys", () => {
    const keys = BOOKING_FILTERS.map((f) => f.key)
    for (const key of BADGED_FILTERS) {
      assert.ok(keys.includes(key), `"${key}" is not a filter`)
    }
  })

  it("never badges `all`", () => {
    // `all` resolves to an empty status list, so a count query for it would
    // return 0 and render nothing — but the intent matters more than the
    // accident: a total on "All" is not work waiting on anyone.
    assert.ok(!BADGED_FILTERS.includes("all"))
  })

  it("gives every badged filter a non-empty status list to count", () => {
    // A badged group with no statuses would silently always read zero.
    for (const key of BADGED_FILTERS) {
      assert.ok(
        statusesForFilter(key).length > 0,
        `"${key}" is badged but selects no statuses`,
      )
    }
  })
})
