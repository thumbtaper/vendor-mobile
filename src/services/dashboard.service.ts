// Dashboard statistics — computed, per D2-A.
//
// The web dashboard hard-codes three of its four cards (`DashboardPage.tsx:21,32,33`:
// a literal date of 23 Apr 2026, an all-time count labelled "this month", and the
// string "₱ 4,550"). Mobile computes all four for real, so the two clients will
// disagree until the web is corrected (I9). That is expected, not a mobile bug.
//
// Counts use `head: true` — the cards need numbers, not rows.

import { supabase } from "@/lib/supabase/client"
import { rangeLabel } from "@/lib/dateWindows"
import { phToday } from "@/lib/format"
import type { DateWindow } from "@/lib/types"
import { TOTALS_MAX_ROWS } from "./transactions.service"
import { sumTransactionTotals, type TotalsRow } from "./transactionTotals"

export interface DashboardStats {
  /**
   * ⚠️ NOT scoped to the selected period, and that is a correctness rule rather
   * than an oversight. Pending is a live work queue: hiding an approval because
   * it falls outside the period the vendor happens to be looking at buries work
   * they must do. Same reasoning for `todaysBookings` — "today" is today.
   */
  pendingApprovals: number
  todaysBookings: number
  /** Scoped to the selected period. */
  completed: number
  /** Scoped to the selected period. */
  revenue: number
  /**
   * False when the payment ledger could not be read — currently the case whenever
   * `booking_transactions` is absent from the deployed schema (plan B1). The card
   * then shows "unavailable" instead of a confident ₱ 0, which would be a lie.
   */
  revenueAvailable: boolean
  /**
   * False when the period holds more payments than one query may total
   * (`TOTALS_MAX_ROWS`), so the revenue figure covers the most recent
   * `TOTALS_MAX_ROWS` and the real total is HIGHER. Surfaced on the dashboard —
   * a silently short money figure is the defect this flag exists to prevent
   * (unbounded-queries plan B1/I1).
   */
  revenueComplete: boolean
  /**
   * How the period reads on screen ("Aug 2026", "Today", "14 May – 14 Aug 2026").
   *
   * Returned WITH the numbers, deliberately: derive it separately in the view and
   * a re-render between fetches can print one period's label over another
   * period's figures. It was `monthLabel` while the period was always a month.
   */
  periodLabel: string
}

async function countBookings(
  vendorId: string,
  build: (q: ReturnType<typeof bookingsQuery>) => ReturnType<typeof bookingsQuery>,
): Promise<number> {
  const { count, error } = await build(bookingsQuery(vendorId))
  if (error) throw error
  return count ?? 0
}

function bookingsQuery(vendorId: string) {
  return supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
}

// Named for the window, not for a month: the period is selectable, so
// "getMonthlyRevenue" would have been wrong on four of the five presets.
async function getRevenueForWindow(
  vendorId: string,
  { from, to }: DateWindow,
): Promise<{ total: number; available: boolean; complete: boolean }> {
  // `to` is an inclusive calendar day but created_at is a timestamptz, so the
  // upper bound is the start of the following day rather than `to` itself —
  // otherwise every payment made after midnight on the last day of the period is
  // silently dropped.
  const upperExclusive = nextDay(to)

  // BOUNDED, and ordered so the bound is deterministic (plan B1). This select was
  // previously unbounded, which meant PostgREST's 1000-row default silently
  // truncated it: the identical query on web understated a real vendor's total by
  // 19.7% with no error raised to supabase-js. `count: "exact"` is what makes the
  // shortfall detectable rather than invisible.
  //
  // Same ceiling as the transactions summary because it is the same table, the
  // same payable rule and the same consequence — see TOTALS_MAX_ROWS.
  const { data, error, count } = await supabase
    .from("booking_transactions")
    .select("amount_paid, platform_fee_amount, payout_amount, payout_status", {
      count: "exact",
    })
    .eq("vendor_id", vendorId)
    .gte("created_at", `${from}T00:00:00Z`)
    .lt("created_at", `${upperExclusive}T00:00:00Z`)
    .order("created_at", { ascending: false })
    .range(0, TOTALS_MAX_ROWS - 1)

  // An unreadable ledger stays "unavailable", not a confident ₱ 0 — and not
  // "partial" either, so the card shows one honest state rather than two.
  if (error) return { total: 0, available: false, complete: true }

  const rows = (data as unknown as TotalsRow[]) ?? []

  // The payable rule is NOT re-implemented here. `sumTransactionTotals` is the
  // app's single, unit-tested home for it (`transactionTotals.test.ts`), and the
  // rule it encodes — an absent payout_status defaults to `held`, never to payable
  // — is the one piece of arithmetic that must not exist twice. Its `payout` is
  // exactly this card's figure; the two extra money columns it also sums are the
  // price of that reuse, and they are two numerics per row.
  const total = sumTransactionTotals(rows).payout

  const totalCount = count ?? rows.length
  return { total, available: true, complete: totalCount <= TOTALS_MAX_ROWS }
}

function nextDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * The four dashboard figures for one period.
 *
 * ⚠️ Only TWO of them take the window. `pendingApprovals` and `todaysBookings` are
 * deliberately unscoped — see the interface above. If a future change scopes them
 * "for consistency", it is hiding work from the vendor.
 *
 * `booked_date` is a `date` column, so the window's inclusive calendar days apply
 * to it directly. The revenue query bounds a timestamptz and needs the extra step;
 * that is handled inside `getRevenueForWindow`, not here.
 */
export async function getDashboardStats(
  vendorId: string,
  window: DateWindow,
): Promise<DashboardStats> {
  const today = phToday()
  const { from, to } = window

  const [pendingApprovals, todaysBookings, completed, revenue] =
    await Promise.all([
      countBookings(vendorId, (q) => q.eq("status", "pending")),
      // Excludes cancelled: a cancelled booking is not something the vendor is
      // doing today.
      countBookings(vendorId, (q) =>
        q.eq("booked_date", today).neq("status", "cancelled"),
      ),
      countBookings(vendorId, (q) =>
        q.eq("status", "completed").gte("booked_date", from).lte("booked_date", to),
      ),
      getRevenueForWindow(vendorId, window),
    ])

  return {
    pendingApprovals,
    todaysBookings,
    completed,
    revenue: revenue.total,
    revenueAvailable: revenue.available,
    revenueComplete: revenue.complete,
    periodLabel: rangeLabel(window),
  }
}
