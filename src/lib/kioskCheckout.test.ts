import assert from "node:assert/strict"
import { test } from "node:test"
import { canPayKioskReceipt, createKioskCheckoutAttempt, isKioskReceiptConfirmed, mapKioskReceipt, type KioskReceiptRow } from "./kioskCheckout.ts"

const row: KioskReceiptRow = {
  id: "booking", price_paid: "250.50", is_paid: false, status: "pending",
  booked_date: "2026-09-16", start_time: "23:00:00", end_time: "01:00:00",
  end_date: "2026-09-17", offerings: { name: "Court" },
}

test("receipt uses the stored amount, payment truth and overnight boundaries", () => {
  const receipt = mapKioskReceipt(row)
  assert.equal(receipt.amount, 250.5)
  assert.equal(receipt.paid, false)
  assert.equal(receipt.startTime, "23:00")
  assert.equal(receipt.endTime, "01:00")
  assert.equal(receipt.endDate, "2026-09-17")
  assert.equal(canPayKioskReceipt(receipt), true)
  assert.equal(canPayKioskReceipt({ ...receipt, paid: true }), false)
  assert.equal(isKioskReceiptConfirmed({ ...receipt, paid: true }), true)
  assert.equal(isKioskReceiptConfirmed({ ...receipt, paid: true, status: "refunded" }), false)
  for (const status of ["cancelled", "refunded", "rejected", "unknown"]) {
    assert.equal(canPayKioskReceipt({ ...receipt, status }), false)
  }
})

test("missing receipt amounts never become zero; real free settlements skip payment", () => {
  for (const amount of [null, "", "NaN", -1, Infinity]) {
    assert.throws(() => mapKioskReceipt({ ...row, price_paid: amount }))
  }
  assert.throws(() => mapKioskReceipt({ ...row, offerings: null }))
  assert.throws(() => mapKioskReceipt({ ...row, is_paid: null as unknown as boolean }))
  const free = mapKioskReceipt({ ...row, price_paid: 0, is_paid: true, offerings: [{ name: "Free court" }] })
  assert.equal(free.amount, 0)
  assert.equal(free.paid, true)
  assert.equal(canPayKioskReceipt(free), false)
  assert.equal(isKioskReceiptConfirmed(free), true)
})

test("duplicate booking and session calls reuse a single result", async () => {
  let bookings = 0, sessions = 0
  const attempt = createKioskCheckoutAttempt(async () => {
    bookings++; return { bookingId: "b1" }
  }, async id => { sessions++; return { url: `https://example.test/${id}` } })
  assert.deepEqual(await Promise.all([attempt.book(), attempt.book()]), [{ bookingId: "b1" }, { bookingId: "b1" }])
  assert.equal(bookings, 1)
  await Promise.all([attempt.payment("b1"), attempt.payment("b1")])
  assert.equal(sessions, 1)
  attempt.dispose()
  await assert.rejects(attempt.book())
  await assert.rejects(attempt.payment("b1"))
  assert.equal(bookings, 1)
  assert.equal(sessions, 1)
})

test("ambiguous write failures cannot silently create another booking or session", async () => {
  let bookings = 0, sessions = 0
  const attempt = createKioskCheckoutAttempt<{ bookingId: string }, never>(async () => {
    bookings++; throw new Error("Response lost after insert")
  }, async () => { sessions++; throw new Error("Response lost after session creation") })
  await assert.rejects(attempt.book())
  await assert.rejects(attempt.book())
  await assert.rejects(attempt.payment("known-booking"))
  await assert.rejects(attempt.payment("known-booking"))
  assert.equal(bookings, 1)
  assert.equal(sessions, 1)
})
