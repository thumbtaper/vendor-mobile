import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { classifyBookingError, StaleBookingError } from "./bookingErrors.ts"

describe("classifyBookingError — B4", () => {
  it("returns null when there was no error", () => {
    assert.equal(classifyBookingError(null), null)
    assert.equal(classifyBookingError(undefined), null)
  })

  it("recognises the status-transition trigger's exception", () => {
    // Exact message from validate_booking_status_transition:
    //   'Invalid booking status transition: % → %'
    const error = classifyBookingError({
      message: "Invalid booking status transition: confirmed → confirmed",
    })
    assert.ok(error instanceof StaleBookingError)
    assert.match(error!.message, /already handled/)
  })

  it("recognises it regardless of the surrounding wrapper text", () => {
    const error = classifyBookingError({
      message:
        'database error: P0001 raise exception "Invalid booking status transition: pending → completed"',
    })
    assert.ok(error instanceof StaleBookingError)
  })

  it("does NOT classify an unrelated failure as stale", () => {
    // Critical: a network blip must stay retryable. Reporting it as "already
    // handled" would tell the vendor a booking was actioned when it wasn't.
    const error = classifyBookingError({ message: "TypeError: Network request failed" })
    assert.ok(error instanceof Error)
    assert.ok(!(error instanceof StaleBookingError))
  })

  it("survives an error object with no message", () => {
    const error = classifyBookingError({})
    assert.ok(error instanceof Error)
    assert.ok(!(error instanceof StaleBookingError))
  })
})
