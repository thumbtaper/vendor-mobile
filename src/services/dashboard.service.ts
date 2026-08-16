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
import { summariseFinancials, type FinancialTotals } from "./financials"
import { TOTALS_MAX_ROWS } from "./transactions.service"
import type { TotalsRow } from "./transactionTotals"

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
  /**
   * The Earnings group's four figures, scoped to the selected period — or `null`
   * when the ledger could not be read.
   *
   * ⚠️ `null`, NEVER zeroed totals. A vendor who earned money this period must not
   * be shown a confident ₱ 0 because a fetch failed; the cards render "—" instead.
   * That is why this is a nullable object rather than flat fields with an
   * `available` flag beside them — the flag can be ignored, a null cannot.
   *
   * Replaced the single payable-only `revenue` number. `earnings.payout` is that
   * same figure, unchanged: it is the one member computed on the payable-only
   * rule, which `financials.test.ts` asserts against `sumTransactionTotals`.
   */
  earnings: FinancialTotals | null
  /**
   * False when the period holds more payments than one query may total
   * (`TOTALS_MAX_ROWS`), so the figures cover the most recent `TOTALS_MAX_ROWS`
   * and the real totals are HIGHER. Surfaced in the Earnings caption — a silently
   * short money figure is the defect this flag exists to prevent
   * (unbounded-queries plan B1/I1).
   */
  earningsComplete: boolean
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
//
// Returns the FULL decomposition rather than one number. ⚠️ The query is
// unchanged — it already selected all four money columns, because the payable
// reducer needed them. The Earnings group is therefore four figures at the cost of
// zero extra network work; only the reduction changed.
async function getEarningsForWindow(
  vendorId: string,
  { from, to }: DateWindow,
): Promise<{ totals: FinancialTotals | null; complete: boolean }> {
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

  // An unreadable ledger yields NULL totals, not zeroed ones — and not "partial"
  // either, so the cards show one honest state ("—") rather than two.
  if (error) return { totals: null, complete: true }

  const rows = (data as unknown as TotalsRow[]) ?? []

  // The arithmetic is NOT re-implemented here. `summariseFinancials` is its single
  // unit-tested home (`financials.test.ts`), including the rule that an absent
  // payout_status defaults to `held` and never to payable.
  //
  // ⚠️ Its `payout` is byte-for-byte what the old single `revenue` figure was —
  // `sumTransactionTotals(rows).payout` — which is asserted directly in
  // `financials.test.ts`. The card is being renamed to "Payout Released", not
  // recalculated. The other three figures are NEW and sit on a wider,
  // non-reversed basis; the Earnings caption states that, because on that basis
  // `gross` can exceed the Transactions screen's "Collected" for the same period.
  const totals = summariseFinancials(rows)

  const totalCount = count ?? rows.length
  return { totals, complete: totalCount <= TOTALS_MAX_ROWS }
}

function nextDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Every dashboard figure for one period — three Operations counts plus the
 * Earnings decomposition.
 *
 * ⚠️ Only TWO of the counts take the window. `pendingApprovals` and `todaysBookings` are
 * deliberately unscoped — see the interface above. If a future change scopes them
 * "for consistency", it is hiding work from the vendor.
 *
 * `booked_date` is a `date` column, so the window's inclusive calendar days apply
 * to it directly. The revenue query bounds a timestamptz and needs the extra step;
 * that is handled inside `getEarningsForWindow`, not here.
 */
export async function getDashboardStats(
  vendorId: string,
  window: DateWindow,
): Promise<DashboardStats> {
  const today = phToday()
  const { from, to } = window

  const [pendingApprovals, todaysBookings, completed, earnings] =
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
      getEarningsForWindow(vendorId, window),
    ])

  return {
    pendingApprovals,
    todaysBookings,
    completed,
    earnings: earnings.totals,
    earningsComplete: earnings.complete,
    periodLabel: rangeLabel(window),
  }
}
