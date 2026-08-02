// Totals reduction extracted from `transactions.service.ts` for unit testing (I7).
//
// This is I5's payable/total split, and it is the highest-consequence arithmetic
// in the app: it decides what a vendor believes they are owed. Totals cover
// PAYABLE rows only while the count covers every row — the two are deliberately
// different denominators, which is why the UI has to label them.

// Explicit extension and a relative path (not `@/`): this module is exercised by
// the Node test runner, which resolves neither bare extensionless specifiers nor
// the TypeScript path alias. Metro resolves it identically.
import { isPayable } from "../lib/format.ts"
import type { PayoutStatus } from "../lib/types.ts"

export interface TotalsRow {
  amount_paid: number
  platform_fee_amount: number
  payout_amount: number
  // A plain column on booking_transactions, NOT a joined booking field — which is
  // why the totals query no longer embeds `bookings(status)` at all.
  payout_status: PayoutStatus | null
}

export interface Totals {
  collected: number
  platformFees: number
  payout: number
  payableCount: number
}

export function sumTransactionTotals(rows: TotalsRow[]): Totals {
  return rows.reduce<Totals>(
    (acc, row) => {
      // Defaults to `held`, NOT to payable. The old rule defaulted a missing
      // booking join to `confirmed` on the reasoning that a ledger row only exists
      // because a payment happened, so assuming unpayable would understate the
      // vendor. That reasoning does not survive the move to payout_status:
      //   1. payout_status is `not null default 'held'` on the row itself, so
      //      there is no join to lose — an absent value means the column was not
      //      selected, which is a bug, not a payment.
      //   2. Under mutual acknowledgement, "we don't know" must never resolve to
      //      "the vendor is owed it". Overstating money owed is the exact defect
      //      this change removes; understating it is visible and self-correcting.
      const payoutStatus = row.payout_status ?? "held"
      if (!isPayable(payoutStatus)) return acc
      return {
        collected: acc.collected + Number(row.amount_paid),
        platformFees: acc.platformFees + Number(row.platform_fee_amount),
        payout: acc.payout + Number(row.payout_amount),
        payableCount: acc.payableCount + 1,
      }
    },
    { collected: 0, platformFees: 0, payout: 0, payableCount: 0 },
  )
}
