import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  canFlag,
  canUndo,
  fulfilActionFor,
  MIN_DISPUTE_REASON,
} from "./bookingActionRules.ts"
import type { BookingStatus, FulfilmentPattern } from "./types.ts"

const b = (status: BookingStatus, fulfilmentPattern: FulfilmentPattern) => ({
  status,
  fulfilmentPattern,
})

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

describe("fulfilActionFor — the same status, two different buttons", () => {
  it("offers 'Mark as done' for a confirmed SESSION booking", () => {
    assert.deepEqual(b("confirmed", "session") && fulfilActionFor(b("confirmed", "session")), {
      action: "fulfil",
      key: "vendor_fulfil",
    })
  })

  it("offers 'Hand over' for a confirmed CUSTODY booking", () => {
    // Same status as the case above. If the pattern were read from the offering
    // instead of the booking, editing an offering mid-flight would swap this
    // button under an in-progress booking.
    assert.deepEqual(fulfilActionFor(b("confirmed", "custody")), {
      action: "start",
      key: "vendor_start",
    })
  })

  it("offers 'Got it back' from returned, for either pattern", () => {
    for (const pattern of ["session", "custody"] as FulfilmentPattern[]) {
      assert.deepEqual(fulfilActionFor(b("returned", pattern)), {
        action: "confirm_return",
        key: "vendor_confirm_return",
      })
    }
  })

  it("offers NOTHING from any state the vendor cannot move", () => {
    // Every one of these would be rejected by
    // `validate_booking_status_transition`, so offering a button here would
    // guarantee an error toast.
    const noAction: BookingStatus[] = [
      "pending", // approve/reject handles this, not the fulfilment bar
      "fulfilled", // waiting on the customer
      "in_progress", // waiting on the customer
      "completed",
      "disputed", // only Command can resolve
      "cancelled",
      "refunded",
    ]
    for (const status of noAction) {
      for (const pattern of ["session", "custody"] as FulfilmentPattern[]) {
        assert.equal(
          fulfilActionFor(b(status, pattern)),
          null,
          `${status}/${pattern} should offer no fulfilment action`,
        )
      }
    }
  })

  it("covers every status — none is left undecided", () => {
    for (const status of ALL_STATUSES) {
      for (const pattern of ["session", "custody"] as FulfilmentPattern[]) {
        const result = fulfilActionFor(b(status, pattern))
        assert.ok(
          result === null || typeof result.action === "string",
          `${status}/${pattern} returned something malformed`,
        )
      }
    }
  })
})

describe("canUndo — only where the VENDOR acted last", () => {
  it("allows undo from fulfilled and in_progress", () => {
    assert.equal(canUndo("fulfilled"), true)
    assert.equal(canUndo("in_progress"), true)
  })

  it("REFUSES undo from returned — the customer acted there", () => {
    // Rewinding `returned` would erase the customer's statement that they gave
    // the item back, which is not the vendor's to undo.
    assert.equal(canUndo("returned"), false)
  })

  it("refuses undo from every other state", () => {
    for (const status of ALL_STATUSES) {
      if (status === "fulfilled" || status === "in_progress") continue
      assert.equal(canUndo(status), false, `${status} must not be undoable`)
    }
  })
})

describe("canFlag — exactly the states the trigger permits", () => {
  it("allows the four fulfilment-or-later states", () => {
    // These are the `old.status` branches where
    // validate_booking_status_transition permits `-> disputed` for a vendor
    // (20260801000002:120-140). Offering it anywhere else guarantees a rejected
    // write and an error toast for a button that should not have been there.
    for (const status of [
      "fulfilled",
      "in_progress",
      "returned",
      "completed",
    ] as BookingStatus[]) {
      assert.equal(canFlag(status), true, `${status} should be flaggable`)
    }
  })

  it("refuses before fulfilment has started", () => {
    // Reject or cancel are cleaner exits at this point than involving Ezzy.
    assert.equal(canFlag("pending"), false)
    assert.equal(canFlag("confirmed"), false)
  })

  it("refuses on already-ended bookings and on an existing flag", () => {
    for (const status of ["disputed", "cancelled", "refunded"] as BookingStatus[]) {
      assert.equal(canFlag(status), false, `${status} must not be flaggable`)
    }
  })
})

describe("MIN_DISPUTE_REASON", () => {
  it("matches the server-side floor", () => {
    // raise_booking_dispute raises 'Please describe the problem in at least 10
    // characters'. Validating client-side turns a raw Postgres exception into a
    // disabled button.
    assert.equal(MIN_DISPUTE_REASON, 10)
  })
})
