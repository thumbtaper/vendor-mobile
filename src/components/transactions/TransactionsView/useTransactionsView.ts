import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"

import { useTransactionsQuery } from "@/hooks/useTransactionsQuery"
import { defaultWindow, parseWindowParam } from "@/lib/dateWindows"
import type { DateWindow, Transaction } from "@/lib/types"
import { useSessionGate } from "@/providers/SessionGateProvider"

export function useTransactionsView() {
  const router = useRouter()
  const { gate } = useSessionGate()
  const vendorId = gate.selectedVendorId
  // Still defaults to the current month — `defaultWindow()` IS "this month", so
  // this screen opens on exactly the range it always has (D3).
  const [window, setWindowState] = useState<DateWindow>(() => defaultWindow())
  const [search, setSearch] = useState("")

  // Same adapter as the dashboard, and for the same reason: `PeriodFilter` speaks
  // `DateWindow | null` so the bookings list can clear its period, but this screen
  // renders no "All dates" chip and its money totals must always be about SOME
  // bounded range (F9). Kept as two small guards rather than a shared abstraction
  // for two call sites.
  const setWindow = useCallback((next: DateWindow | null) => {
    if (next) setWindowState(next)
  }, [])

  const query = useTransactionsQuery(vendorId, window)

  // Drill-down arrivals from the dashboard's Revenue card (I2). Same shape as
  // `useBookingsList`, with one deliberate difference: a malformed window leaves
  // the current range in place rather than clearing it, because this screen has no
  // "no period" state to fall back to.
  const params = useLocalSearchParams<{ from?: string; to?: string }>()

  useEffect(() => {
    if (!params.from && !params.to) return

    const arriving = parseWindowParam(params.from, params.to)
    /* eslint-disable-next-line react-hooks/set-state-in-effect --
     * One-shot sync from a navigation event, not derived state. See the longer
     * note in `useBookingsList.ts`; the early return and the params clear below
     * make each arrival apply exactly once. */
    if (arriving) setWindowState(arriving)

    // Clearing is what lets the SAME drill-down work twice: without it the second
    // push carries identical params, no value changes, and the effect never runs.
    router.setParams({ from: undefined, to: undefined })
  }, [params.from, params.to, router])

  // Client-side, over loaded rows only (D9). Booker name/email/phone come from
  // an RPC rather than a joinable column, so there is no server-side equivalent
  // without the new SECURITY DEFINER function tracked as a follow-up (I5).
  const filtered: Transaction[] = useMemo(() => {
    if (!search) return query.transactions
    const needle = search.toLowerCase()
    return query.transactions.filter((t) =>
      [t.bookerName, t.bookerEmail, t.bookerPhone, t.offeringName, t.offeringCode]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle)),
    )
  }, [query.transactions, search])

  const refresh = useCallback(async () => {
    await query.refetch()
  }, [query])

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage()
  }, [query])

  // Saying so matters: a vendor searching for a booker whose transaction is on
  // an unloaded page would otherwise conclude it doesn't exist.
  const searchScopeNote =
    search && query.hasNextPage
      ? "Searching the transactions loaded so far. Scroll to load more, or narrow the date range."
      : null

  return {
    window,
    setWindow,
    setSearch,
    transactions: filtered,
    totals: query.totals,
    totalsLoading: query.totalsLoading,
    contactsFailed: query.contactsFailed,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.isError
      ? "Couldn't load your transactions. Pull down to try again."
      : null,
    dataUpdatedAt: query.dataUpdatedAt,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    refresh,
    loadMore,
    searchScopeNote,
    emptyTitle: search ? "No matches" : "No transactions in this range",
    emptyBody: search
      ? "Try a different name, email or offering."
      : "Payments appear here once a booking is paid for.",
  }
}
