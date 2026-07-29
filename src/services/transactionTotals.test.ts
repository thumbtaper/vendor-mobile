import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { sumTransactionTotals, type TotalsRow } from "./transactionTotals.ts"

const row = (status: string | null, paid: number, fee: number, payout: number): TotalsRow => ({
  amount_paid: paid,
  platform_fee_amount: fee,
  payout_amount: payout,
  bookings: status ? { status } : null,
})

describe("sumTransactionTotals — the payable/total split (I5)", () => {
  it("sums nothing for an empty ledger", () => {
    assert.deepEqual(sumTransactionTotals([]), {
      collected: 0,
      platformFees: 0,
      payout: 0,
      payableCount: 0,
    })
  })

  it("adds up payable rows", () => {
    const totals = sumTransactionTotals([
      row("confirmed", 1000, 100, 900),
      row("completed", 500, 50, 450),
    ])
    assert.deepEqual(totals, {
      collected: 1500,
      platformFees: 150,
      payout: 1350,
      payableCount: 2,
    })
  })

  it("EXCLUDES refunded and cancelled from the money, though the payment happened", () => {
    // The seed has exactly this shape — Citywide has 3 refunded and 2 cancelled
    // among its 32 paid bookings. If these leaked into the totals the vendor
    // would be told they are owed money that was returned to the booker.
    const totals = sumTransactionTotals([
      row("confirmed", 1000, 100, 900),
      row("refunded", 999, 99, 900),
      row("cancelled", 777, 77, 700),
    ])
    assert.equal(totals.collected, 1000)
    assert.equal(totals.payout, 900)
    assert.equal(totals.payableCount, 1)
  })

  it("EXCLUDES pending — paid, but not yet accepted by the vendor", () => {
    const totals = sumTransactionTotals([row("pending", 1000, 100, 900)])
    assert.equal(totals.payableCount, 0)
    assert.equal(totals.payout, 0)
  })

  it("treats a missing booking join as confirmed, not as unpayable", () => {
    // The ledger row only exists because a payment happened; defaulting to
    // unpayable would understate the vendor whenever the join is dropped.
    const totals = sumTransactionTotals([row(null, 1000, 100, 900)])
    assert.equal(totals.payableCount, 1)
    assert.equal(totals.payout, 900)
  })

  it("coerces numeric strings — Postgres numeric arrives as text over PostgREST", () => {
    const totals = sumTransactionTotals([
      {
        amount_paid: "1000.50" as unknown as number,
        platform_fee_amount: "100.05" as unknown as number,
        payout_amount: "900.45" as unknown as number,
        bookings: { status: "confirmed" },
      },
    ])
    // String concatenation instead of addition would give "01000.50" here.
    assert.equal(totals.collected, 1000.5)
    assert.equal(totals.payout, 900.45)
  })

  it("keeps payableCount distinct from the row count", () => {
    const rows = [
      row("confirmed", 100, 10, 90),
      row("refunded", 100, 10, 90),
      row("pending", 100, 10, 90),
    ]
    const totals = sumTransactionTotals(rows)
    assert.equal(rows.length, 3)
    assert.equal(totals.payableCount, 1)
  })
})
