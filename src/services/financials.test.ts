import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { PayoutStatus } from "../lib/types.ts"
import { summariseFinancials, ZERO_TOTALS } from "./financials.ts"
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

// One realistic ledger reused across the identity checks: two released, one
// releasable, two held, one reversed.
const LEDGER: TotalsRow[] = [
  row("released", 1000, 100, 900),
  row("released", 2500, 250, 2250),
  row("releasable", 500, 50, 450),
  row("held", 1200, 120, 1080),
  row("held", 800, 80, 720),
  row("reversed", 9999, 999, 9000),
]

/**
 * Compare money in CENTAVOS, which is the unit the identities actually hold in.
 *
 * ⚠️ Written this way after the naive form failed, and the failure is worth
 * keeping in mind rather than hiding: with `10.1 / 20.2 / 30.3`-style rows the
 * reducer returns an exact `gross` of 61.3, but adding its own returned pesos —
 * `t.platformFee + t.net` — yields 61.300000000000004. The reducer is exact; a
 * CONSUMER that re-adds the peso figures can still drift.
 *
 * That is a caveat for any future surface, not just for this test: display the
 * figures, do not re-derive one from the others. Nothing does today —
 * `fmtPeso(n, 0)` renders whole pesos — but a "check my sums" panel would.
 */
const cents = (n: number) => Math.round(n * 100)

describe("summariseFinancials — the two identities", () => {
  it("holds gross = platformFee + net", () => {
    const t = summariseFinancials(LEDGER)
    assert.equal(cents(t.gross), cents(t.platformFee) + cents(t.net))
  })

  it("holds net = payout + onHold", () => {
    const t = summariseFinancials(LEDGER)
    assert.equal(cents(t.net), cents(t.payout) + cents(t.onHold))
  })

  it("holds both identities on values that drift as floats", () => {
    // 0.1 + 0.2 arithmetic, at ledger scale — the case that would break if the
    // reducer accumulated in pesos instead of centavos.
    const awkward: TotalsRow[] = [
      row("released", 10.1, 1.01, 9.09),
      row("released", 20.2, 2.02, 18.18),
      row("held", 30.3, 3.03, 27.27),
      row("releasable", 0.7, 0.07, 0.63),
    ]
    const t = summariseFinancials(awkward)
    assert.equal(cents(t.gross), cents(t.platformFee) + cents(t.net))
    assert.equal(cents(t.net), cents(t.payout) + cents(t.onHold))
    // And the totals themselves carry no float tail.
    assert.equal(t.gross, 61.3)
  })
})

describe("summariseFinancials — the basis", () => {
  it("sums nothing for an empty ledger", () => {
    assert.deepEqual(summariseFinancials([]), ZERO_TOTALS)
  })

  it("EXCLUDES reversed payouts from every figure, and counts them", () => {
    const t = summariseFinancials(LEDGER)
    assert.equal(t.reversedCount, 1)
    assert.equal(t.countedRows, 5)
    // The reversed row's 9999 never reaches gross.
    assert.equal(t.gross, 1000 + 2500 + 500 + 1200 + 800)
  })

  it("counts held money in net but NOT in payout", () => {
    const t = summariseFinancials(LEDGER)
    assert.equal(t.payout, 900 + 2250 + 450)
    assert.equal(t.onHold, 1080 + 720)
    assert.equal(t.payableCount, 3)
  })

  it("treats a missing payout_status as held — never as payable", () => {
    // The column is `not null default 'held'`, so null means it was not selected.
    // "We don't know" must not resolve to "the vendor is owed it".
    const t = summariseFinancials([row(null, 100, 10, 90)])
    assert.equal(t.net, 90)
    assert.equal(t.payout, 0)
    assert.equal(t.onHold, 90)
    assert.equal(t.payableCount, 0)
    // Not reversed either — it still counts toward what was earned.
    assert.equal(t.reversedCount, 0)
    assert.equal(t.countedRows, 1)
  })

  it("keeps payableCount distinct from countedRows", () => {
    const t = summariseFinancials(LEDGER)
    assert.notEqual(t.payableCount, t.countedRows)
  })
})

describe("agreement with the Transactions screen", () => {
  it("payout is IDENTICAL to what the transactions reducer calls payout", () => {
    // The claim the dashboard rename rests on: mobile's existing "Revenue" figure
    // (`sumTransactionTotals(...).payout`) and this module's `payout` are the same
    // sum over the same rows. The card is being renamed to "Payout Released", not
    // recalculated — if this ever fails, that promise is broken.
    assert.equal(
      summariseFinancials(LEDGER).payout,
      sumTransactionTotals(LEDGER).payout,
    )
  })

  it("gross is WIDER than the transactions screen's collected", () => {
    // Not a discrepancy — the documented consequence of the two bases. Pinned so
    // the Earnings caption explaining it cannot be dropped as redundant.
    assert.ok(
      summariseFinancials(LEDGER).gross > sumTransactionTotals(LEDGER).collected,
    )
  })
})
