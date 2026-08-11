import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  BOOKING_ACTIONS,
  actionCopy,
  type BookingActionKey,
} from "./bookingActionCopy.ts"

describe("bookingActionCopy — the table and the lookup agree", () => {
  it("resolves every entry in the table", () => {
    // The round trip is the point: `actionCopy` throws when the table and the
    // key union drift apart, and that throw would otherwise surface as a crashed
    // action bar rather than a failed test.
    for (const action of BOOKING_ACTIONS) {
      assert.equal(actionCopy(action.key).key, action.key)
    }
  })

  it("has no duplicate keys", () => {
    const keys = BOOKING_ACTIONS.map((a) => a.key)
    assert.equal(new Set(keys).size, keys.length)
  })

  it("throws on an unknown key rather than returning undefined", () => {
    assert.throws(
      () => actionCopy("vendor_nonsense" as BookingActionKey),
      /No booking action copy/,
    )
  })
})

describe("bookingActionCopy — wording invariants", () => {
  it("gives every action a non-empty label and meaning", () => {
    for (const a of BOOKING_ACTIONS) {
      assert.ok(a.label.trim().length > 0, `${a.key} has no label`)
      assert.ok(a.meaning.trim().length > 0, `${a.key} has no meaning`)
    }
  })

  it("assigns every action a valid fulfilment pattern", () => {
    for (const a of BOOKING_ACTIONS) {
      assert.ok(
        ["session", "custody", "both"].includes(a.pattern),
        `${a.key} has an invalid pattern: ${a.pattern}`,
      )
    }
  })

  it("assigns every action a stage", () => {
    // The stage is what surfaces filter on to keep the approval actions out of a
    // fulfilment glossary — the web dashboard's "Completing a Booking" item maps
    // this table and would otherwise list Approve and Reject under it.
    for (const a of BOOKING_ACTIONS) {
      assert.ok(
        ["approval", "fulfilment"].includes(a.stage),
        `${a.key} has an invalid stage: ${a.stage}`,
      )
    }
  })

  it("tells the vendor which approval decisions are reversible", () => {
    // Approve is held locally for ~4s and only then written, because
    // `validate_booking_status_transition` permits `pending -> confirmed` but not
    // the reverse (useBookingActions.ts). Reject has no undo path at all — no
    // rule in bookingActionRules.ts offers an action from `cancelled`. Both facts
    // have to survive a copy edit, because a vendor reads them before committing.
    assert.match(actionCopy("vendor_approve").meaning, /few seconds to undo/)
    assert.match(actionCopy("vendor_reject").meaning, /can't be undone/)
  })

  it("names the 3-day window wherever the auto-confirm timer applies", () => {
    // `vendor_fulfil` starts the booker's 3-day clock and `vendor_undo` restarts
    // it. A vendor deciding whether to tap either one is really asking "when does
    // my money move" — dropping the interval from this copy silently removes the
    // answer, and the wording is mirrored in the web app.
    assert.match(actionCopy("vendor_fulfil").meaning, /3 days/)
    assert.match(actionCopy("vendor_undo").meaning, /3-day/)
  })

  it("warns that a flag withholds the payout", () => {
    assert.match(actionCopy("vendor_dispute").meaning, /No payout is released/)
  })
})
