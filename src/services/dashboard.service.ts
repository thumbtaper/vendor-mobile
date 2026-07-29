// Dashboard statistics — computed, per D2-A.
//
// The web dashboard hard-codes three of its four cards (`DashboardPage.tsx:21,32,33`:
// a literal date of 23 Apr 2026, an all-time count labelled "this month", and the
// string "₱ 4,550"). Mobile computes all four for real, so the two clients will
// disagree until the web is corrected (I9). That is expected, not a mobile bug.
//
// Counts use `head: true` — the cards need numbers, not rows.

import { supabase } from "@/lib/supabase/client"
import { isPayable, phCurrentMonthRange, phToday } from "@/lib/format"
import type { BookingStatus } from "@/lib/types"

export interface DashboardStats {
  pendingApprovals: number
  todaysBookings: number
  completedThisMonth: number
  monthlyRevenue: number
  /**
   * False when the payment ledger could not be read — currently the case whenever
   * `booking_transactions` is absent from the deployed schema (plan B1). The card
   * then shows "unavailable" instead of a confident ₱ 0, which would be a lie.
   */
  revenueAvailable: boolean
  monthLabel: string
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

interface RevenueRow {
  payout_amount: number
  bookings: { status: string } | null
}

async function getMonthlyRevenue(
  vendorId: string,
  from: string,
  to: string,
): Promise<{ total: number; available: boolean }> {
  // `to` is an inclusive calendar day but created_at is a timestamptz, so the
  // upper bound is the start of the following day rather than `to` itself —
  // otherwise every payment made after midnight on the last day of the month is
  // silently dropped.
  const upperExclusive = nextDay(to)

  const { data, error } = await supabase
    .from("booking_transactions")
    .select("payout_amount, bookings(status)")
    .eq("vendor_id", vendorId)
    .gte("created_at", `${from}T00:00:00Z`)
    .lt("created_at", `${upperExclusive}T00:00:00Z`)

  if (error) return { total: 0, available: false }

  const rows = (data as unknown as RevenueRow[]) ?? []
  const total = rows.reduce((sum, row) => {
    const status = (row.bookings?.status ?? "confirmed") as BookingStatus
    // Same payable rule as the transactions page — a refunded or cancelled
    // booking's payment really happened, but the vendor is not owed it.
    return isPayable(status) ? sum + Number(row.payout_amount) : sum
  }, 0)

  return { total, available: true }
}

function nextDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export async function getDashboardStats(
  vendorId: string,
): Promise<DashboardStats> {
  const today = phToday()
  const { from, to } = phCurrentMonthRange()

  const [pendingApprovals, todaysBookings, completedThisMonth, revenue] =
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
      getMonthlyRevenue(vendorId, from, to),
    ])

  return {
    pendingApprovals,
    todaysBookings,
    completedThisMonth,
    monthlyRevenue: revenue.total,
    revenueAvailable: revenue.available,
    monthLabel: new Date(`${from}T00:00:00Z`).toLocaleDateString("en-GB", {
      timeZone: "Asia/Manila",
      month: "short",
      year: "numeric",
    }),
  }
}
