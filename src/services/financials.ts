/*
 * Vendor earnings, derived from the booking_transactions ledger.
 *
 * Adapted from `vendor/lib/financials.ts` — copied and adapted, never imported
 * (separate repos, no shared build). Two deliberate differences from the web
 * original are marked ⚠️ below; everything else is the same arithmetic.
 *
 * Lives in `services/` rather than `lib/` — a deviation from the plan's §7, made
 * on this app's own precedent. `transactionTotals.ts`, `bookingErrors.ts` and
 * `vendorMapping.ts` are all pure, unit-tested reducers that sit here because they
 * operate on RAW DB ROWS pulled by a service, while `lib/` holds app-wide helpers
 * (`format`, `dateWindows`, `bookingFilters`). This is squarely the former, and
 * the placement lets it share `TotalsRow` with `transactionTotals.ts` instead of
 * declaring a second identical shape — which a `lib/` module could not do without
 * importing `services/` and inverting the layer.
 *
 * ── The basis ───────────────────────────────────────────────────────────────
 * Every figure except `payout` is computed over transactions in the period whose
 * payout has NOT been reversed. Reversed money is money the vendor will never be
 * paid — folding it into "earned" would tell them a refunded booking is still
 * coming.
 *
 * Two identities hold exactly, and are asserted in `financials.test.ts`:
 *
 *     gross = platformFee + net        net = payout + onHold
 *
 * ⚠️ THIS BASIS DIFFERS FROM THE TRANSACTIONS SCREEN, which totals payable rows
 * only (`transactionTotals.ts`). That is deliberate: it is what lets the dashboard
 * separate "earned" from "released", which a payable-only basis cannot express
 * because Net and Payout collapse into the same number. The consequence is that
 * `gross` here can EXCEED the Transactions screen's "Collected" for the same
 * period whenever something is still held. Any surface rendering these totals
 * MUST state its basis, or the two screens look like they disagree for no reason.
 *
 * ⚠️ `payout` is the ONE figure computed on the payable-only rule — which makes it
 * arithmetically identical to what the dashboard's "Revenue" card already showed
 * before this module existed. That card is being renamed, not recalculated.
 */

// Explicit extension and a relative path, not `@/`: this module is exercised by
// the Node test runner, which resolves neither bare extensionless specifiers nor
// the TypeScript path alias. Metro resolves it identically. Same constraint as
// `transactionTotals.ts`, whose row shape is reused below.
import { isPayable } from "../lib/format.ts"
import type { TotalsRow } from "./transactionTotals.ts"

export interface FinancialTotals {
  /** Collected from customers, excluding reversed payouts. */
  gross: number
  /** Commission deducted, on the same basis as `gross`. */
  platformFee: number
  /** Earned after the platform fee — INCLUDES money still held. */
  net: number
  /** Released or releasable: the part of `net` the vendor can actually be paid. */
  payout: number
  /** Earned but not yet released, i.e. `net - payout`. Never includes reversed. */
  onHold: number
  /** Transactions excluded from every figure above. Surface only when > 0. */
  reversedCount: number
  /** How many transactions the figures were computed from. */
  countedRows: number
  /**
   * How many of `countedRows` are payable — the rows `payout` was summed from.
   *
   * ⚠️ NOT interchangeable with `countedRows`: that is every non-reversed payment,
   * this is only those the vendor is actually owed. The gap between them is the
   * held rows.
   */
  payableCount: number
}

export const ZERO_TOTALS: FinancialTotals = {
  gross: 0,
  platformFee: 0,
  net: 0,
  payout: 0,
  onHold: 0,
  reversedCount: 0,
  countedRows: 0,
  payableCount: 0,
}

// Money is accumulated in integer centavos, not floats.
//
// The figures are numeric(10,2) in Postgres and arrive as JS numbers, so summing
// them directly drifts in the last bits — and `gross === platformFee + net` is
// then true in arithmetic but false in JavaScript, because the two sides sum a
// different set of values in a different order. Whole centavos make both
// identities exact rather than approximately true. `financials.test.ts` pins a
// case that fails without this.
const toCents = (n: number) => Math.round(Number(n) * 100)
const fromCents = (c: number) => c / 100

export function summariseFinancials(rows: TotalsRow[]): FinancialTotals {
  let grossC = 0
  let feeC = 0
  let netC = 0
  let payoutC = 0
  let reversedCount = 0
  let countedRows = 0
  let payableCount = 0

  for (const row of rows) {
    // ⚠️ Defaults to `held`, exactly as `transactionTotals.ts` does, and for the
    // reasons recorded there: the column is `not null default 'held'`, so an
    // absent value means it was not selected — a bug, not a payment — and "we
    // don't know" must never resolve to "the vendor is owed it". Mobile's row
    // type allows null where the web's does not, which is why this line has no
    // counterpart in the original.
    const payoutStatus = row.payout_status ?? "held"

    // The one exclusion. Counted so the UI can say why a figure looks light,
    // never silently dropped.
    if (payoutStatus === "reversed") {
      reversedCount++
      continue
    }

    countedRows++
    grossC += toCents(row.amount_paid)
    feeC += toCents(row.platform_fee_amount)
    netC += toCents(row.payout_amount)

    // Read the payable rule from `format.ts` rather than re-deriving it: it is
    // DB-driven on purpose, because a payout already released before a later
    // refund stays released.
    if (isPayable(payoutStatus)) {
      payoutC += toCents(row.payout_amount)
      payableCount++
    }
  }

  return {
    gross: fromCents(grossC),
    platformFee: fromCents(feeC),
    net: fromCents(netC),
    payout: fromCents(payoutC),
    // Subtracted in centavos, so this is exactly the sum of the held rows.
    onHold: fromCents(netC - payoutC),
    reversedCount,
    countedRows,
    payableCount,
  }
}
