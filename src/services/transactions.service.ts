// Adapted from `vendor/services/transactions.service.ts`, restructured for D9.
//
// The web pulls up to 10,000 rows so it can search and total client-side — booker
// name/email/phone come from an RPC, not a joinable column, so they cannot be
// searched server-side. That is untenable on a phone.
//
// D9's approach instead:
//   - a DATE WINDOW is applied server-side (`created_at` bounds),
//   - rows inside it are paged for infinite scroll,
//   - search filters the loaded rows client-side,
//   - a separate lightweight query totals the whole window, so the summary is
//     never just "what happened to be scrolled".
//
// A server-side search RPC remains the tracked follow-up (I5 option b); it is a
// new SECURITY DEFINER function exposing booker PII, so it needs its own
// approval and RLS review.

import { supabase } from "@/lib/supabase/client"
import type {
  BookingStatus,
  DateWindow,
  PayoutStatus,
  Transaction,
} from "@/lib/types"
import type { BookerContact } from "./bookings.service"
import { sumTransactionTotals, type TotalsRow } from "./transactionTotals"

export const TRANSACTIONS_PAGE_SIZE = 20

// Ceiling for money-aggregate queries over `booking_transactions`. Beyond this the
// figure reports itself as partial rather than quietly understating the vendor's
// money.
//
// Exported because `dashboard.service.ts`'s revenue figure aggregates the SAME
// table on the same payable rule and must use the SAME ceiling — two unexplained
// ceilings in one app is how they drift (unbounded-queries plan C3). If a third
// aggregate ever needs it, that is the signal to give the app one shared constant
// module rather than passing this one around further.
export const TOTALS_MAX_ROWS = 2000

interface DbRow {
  id: string
  booking_id: string
  amount_paid: number
  platform_fee_percent: number
  platform_fee_amount: number
  payout_amount: number
  payout_status: string
  created_at: string
  bookings: {
    booker_id: string
    booked_date: string
    status: string
    offerings: { name: string; code: string } | null
  } | null
}

const SELECT_COLS = `
  id, booking_id, amount_paid, platform_fee_percent, platform_fee_amount, payout_amount,
  payout_status, created_at,
  bookings(booker_id, booked_date, status, offerings(name, code))
`

export interface TransactionsPage {
  transactions: Transaction[]
  nextPage: number | null
}

export interface TransactionTotals {
  collected: number
  platformFees: number
  payout: number
  /** Rows counted in the totals above (payable rows only). */
  payableCount: number
  /** Every transaction in the window, payable or not. */
  totalCount: number
  /** False when the window holds more rows than the ceiling — totals are a subset. */
  complete: boolean
}

function toTransaction(
  row: DbRow,
  contact: BookerContact | undefined,
): Transaction {
  return {
    id: row.id,
    bookingId: row.booking_id,
    bookerId: row.bookings?.booker_id ?? "",
    bookerName: contact?.full_name ?? "",
    bookerEmail: contact?.email ?? "",
    bookerPhone: contact?.phone ?? "",
    offeringName: row.bookings?.offerings?.name ?? "",
    offeringCode: row.bookings?.offerings?.code ?? "",
    bookedDate: row.bookings?.booked_date ?? "",
    status: (row.bookings?.status ?? "confirmed") as BookingStatus,
    payoutStatus: (row.payout_status ?? "held") as PayoutStatus,
    amountPaid: row.amount_paid,
    platformFeePercent: row.platform_fee_percent,
    platformFeeAmount: row.platform_fee_amount,
    payoutAmount: row.payout_amount,
    transactionDate: row.created_at,
  }
}

// `to` is an inclusive calendar day, but created_at is a timestamptz — so the
// upper bound is the start of the next day. Comparing against `to` itself drops
// every payment made after midnight on the final day of the range.
function nextDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export async function getTransactionsPage(
  vendorId: string,
  page: number,
  window: DateWindow,
  contacts: Map<string, BookerContact>,
): Promise<TransactionsPage> {
  const from = page * TRANSACTIONS_PAGE_SIZE
  const to = from + TRANSACTIONS_PAGE_SIZE - 1

  const { data, error } = await supabase
    .from("booking_transactions")
    .select(SELECT_COLS)
    .eq("vendor_id", vendorId)
    .gte("created_at", `${window.from}T00:00:00Z`)
    .lt("created_at", `${nextDay(window.to)}T00:00:00Z`)
    // created_at alone is not a stable sort — two payments can share a timestamp
    // and ties reorder between requests, duplicating or dropping rows across page
    // boundaries. id is the tiebreaker.
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to)

  if (error) throw error

  const rows = (data as unknown as DbRow[]) ?? []
  return {
    transactions: rows.map((row) =>
      toTransaction(row, contacts.get(row.bookings?.booker_id ?? "")),
    ),
    nextPage: rows.length === TRANSACTIONS_PAGE_SIZE ? page + 1 : null,
  }
}

// Totals for the whole window, independent of how far the list has been scrolled.
// Only the money columns and the joined status are selected — no offerings, no
// contacts — which is what makes covering the window affordable on a phone.
export async function getTransactionTotals(
  vendorId: string,
  window: DateWindow,
): Promise<TransactionTotals> {
  const { data, error, count } = await supabase
    .from("booking_transactions")
    .select("amount_paid, platform_fee_amount, payout_amount, payout_status", {
      count: "exact",
    })
    .eq("vendor_id", vendorId)
    .gte("created_at", `${window.from}T00:00:00Z`)
    .lt("created_at", `${nextDay(window.to)}T00:00:00Z`)
    .order("created_at", { ascending: false })
    .range(0, TOTALS_MAX_ROWS - 1)

  if (error) throw error

  const rows = (data as unknown as TotalsRow[]) ?? []

  // Totals cover payable rows only, while `totalCount` covers every row — the
  // same split the web page makes, and it must stay labelled on screen or the
  // two numbers look inconsistent. Reduction lives in `transactionTotals.ts` so
  // it is unit-testable without a Supabase client (I7).
  const totals = sumTransactionTotals(rows)

  const totalCount = count ?? rows.length
  return { ...totals, totalCount, complete: totalCount <= TOTALS_MAX_ROWS }
}
