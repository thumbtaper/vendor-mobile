import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { PayoutStatus } from "../lib/types.ts"
import { sumTransactionTotals, type TotalsRow } from "./transactionTotals.ts"

const row = (
  payoutStatus: PayoutStatus | null,
  paid: number,
  fee: number,
  payout: number,
): TotalsRow => ({
  amount_paid: paid,
  platform_fee_amount: fee,
  payout_amount: payout,
  payout_status: payoutStatus,
})

describe("sumTransactionTotals — the payable/total split", () => {
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
      row("releasable", 1000, 100, 900),
      row("released", 500, 50, 450),
    ])
    assert.deepEqual(totals, {
      collected: 1500,
      platformFees: 150,
      payout: 1350,
      payableCount: 2,
    })
  })

  it("EXCLUDES held — the booking is not yet mutually confirmed", () => {
    // This is the case the whole dual-acknowledgement feature turns on. Under the
    // old status-keyed rule a `confirmed` booking counted as payable, so a vendor
    // was shown money for work they had not yet delivered.
    const totals = sumTransactionTotals([row("held", 1000, 100, 900)])
    assert.equal(totals.payableCount, 0)
    assert.equal(totals.payout, 0)
  })

  it("EXCLUDES reversed, though the payment really happened", () => {
    const totals = sumTransactionTotals([
      row("releasable", 1000, 100, 900),
      row("reversed", 999, 99, 900),
    ])
    assert.equal(totals.collected, 1000)
    assert.equal(totals.payout, 900)
    assert.equal(totals.payableCount, 1)
  })

  it("KEEPS released — money that has left is still the vendor's", () => {
    // A payout released before a later refund stays released; the DB never
    // downgrades it, and neither may the totals.
    const totals = sumTransactionTotals([row("released", 1000, 100, 900)])
    assert.equal(totals.payableCount, 1)
    assert.equal(totals.payout, 900)
  })

  it("treats a missing payout_status as HELD, not as payable", () => {
    // Inverted deliberately from the old rule, which defaulted a missing booking
    // join to `confirmed` (payable). payout_status is `not null default 'held'`
    // on the row itself, so an absent value means the column was not selected —
    // a bug. "We don't know" must never resolve to "the vendor is owed it".
    const totals = sumTransactionTotals([row(null, 1000, 100, 900)])
    assert.equal(totals.payableCount, 0)
    assert.equal(totals.payout, 0)
  })

  it("coerces numeric strings — Postgres numeric arrives as text over PostgREST", () => {
    const totals = sumTransactionTotals([
      {
        amount_paid: "1000.50" as unknown as number,
        platform_fee_amount: "100.05" as unknown as number,
        payout_amount: "900.45" as unknown as number,
        payout_status: "releasable",
      },
    ])
    // String concatenation instead of addition would give "01000.50" here.
    assert.equal(totals.collected, 1000.5)
    assert.equal(totals.payout, 900.45)
  })

  it("keeps payableCount distinct from the row count", () => {
    const rows = [
      row("releasable", 100, 10, 90),
      row("reversed", 100, 10, 90),
      row("held", 100, 10, 90),
    ]
    const totals = sumTransactionTotals(rows)
    assert.equal(rows.length, 3)
    assert.equal(totals.payableCount, 1)
  })
})
