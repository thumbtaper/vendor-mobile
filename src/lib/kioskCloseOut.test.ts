import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { closeOutDoneMessage, closeOutItem, normaliseCloseOutIdentifier, parseCloseOutBookings } from "./kioskCloseOut.ts"

const booking = (over: Record<string, unknown> = {}) => ({
  id: "booking-1", offeringName: "Kayak rental", stage: "ready", status: "in_progress",
  bookedDate: "2026-09-17", startTime: "09:00", ...over,
})

describe("kiosk close-out response", () => {
  it("normalises the customer identifier before lookup", () => {
    assert.equal(normaliseCloseOutIdentifier("  0917 123 4567  "), "0917 123 4567")
  })

  it("accepts the staged response and keeps the server stage", () => {
    const result = parseCloseOutBookings({ bookings: [booking()] })
    assert.equal(result.length, 1)
    assert.equal(result[0]?.stage, "ready")
  })

  it("drops malformed or unknown rows instead of rendering unsafe response data", () => {
    assert.deepEqual(parseCloseOutBookings({ bookings: [booking({ stage: "new_status" }), { id: "x" }] }), [])
    assert.deepEqual(parseCloseOutBookings({}), [])
  })

  it("offers the custody action and schedule only when ready", () => {
    const item = closeOutItem(parseCloseOutBookings({ bookings: [booking()] })[0]!)
    assert.equal(item.action?.label, "I've returned it")
    assert.match(item.when ?? "", /09:00$/)
    assert.equal(item.message, null)
  })

  it("shows non-actionable copy without exposing date or time", () => {
    const item = closeOutItem(parseCloseOutBookings({ bookings: [booking({ stage: "confirmed_custody", status: "confirmed" })] })[0]!)
    assert.equal(item.action, null)
    assert.equal(item.when, null)
    assert.match(item.message ?? "", /hands it over/)
  })

  it("uses distinct completion messages", () => {
    assert.match(closeOutDoneMessage("returned"), /front desk/)
    assert.match(closeOutDoneMessage("completed"), /all done/)
  })
})
