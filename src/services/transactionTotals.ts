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
import type { BookingStatus } from "../lib/types.ts"

export interface TotalsRow {
  amount_paid: number
  platform_fee_amount: number
  payout_amount: number
  bookings: { status: string } | null
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
      // A missing join defaults to `confirmed`: the ledger row only exists
      // because a payment happened, so treating it as unpayable would understate
      // the vendor. Matches the web service's fallback.
      const status = (row.bookings?.status ?? "confirmed") as BookingStatus
      if (!isPayable(status)) return acc
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
