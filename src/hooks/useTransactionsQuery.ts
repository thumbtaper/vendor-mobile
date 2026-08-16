import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { DateWindow, Transaction } from "@/lib/types"
import {
  getTransactionTotals,
  getTransactionsPage,
} from "@/services/transactions.service"

// Takes a WINDOW, not a preset name (dashboard range plan D1c). The preset table
// and its arithmetic — including the "no all time" refusal that used to live here
// — moved to `lib/dateWindows.ts`, where they are shared with the dashboard and
// the bookings list and are unit-testable. A carried-in window from a dashboard
// drill-down could not be represented while this took a preset name.
export function useTransactionsQuery(
  vendorId: string | null,
  window: DateWindow,
) {
  const list = useInfiniteQuery({
    // First key element matches `PERSISTED_KEYS` so the first page survives a
    // cold offline open (D11).
    //
    // ⚠️ Keyed by the window's BOUNDS, where it used to be keyed by a preset
    // name. One-time cost, worth stating: every persisted entry written by an
    // older build misses after this update, so the first open refetches. No wrong
    // data — a miss, not a stale hit.
    queryKey: ["transactions-first-page", vendorId ?? "", window.from, window.to],
    enabled: Boolean(vendorId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getTransactionsPage(vendorId!, pageParam, window),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })

  const totals = useQuery({
    queryKey: ["transaction-totals", vendorId ?? "", window.from, window.to],
    enabled: Boolean(vendorId),
    queryFn: () => getTransactionTotals(vendorId!, window),
  })

  const transactions: Transaction[] = useMemo(
    () => list.data?.pages.flatMap((p) => p.transactions) ?? [],
    [list.data],
  )

  return {
    ...list,
    transactions,
    totals: totals.data ?? null,
    totalsLoading: totals.isLoading,
    // A contacts failure degrades search rather than breaking the page: the money
    // is still correct, but booker names are blank and searching by booker
    // matches nothing. The web reports this separately for the same reason.
    //
    // Now reported PER PAGE by the service, since contacts are resolved there
    // (unbounded-queries B2). Any affected page raises the notice — one page of
    // anonymous rows is enough to make a search misleading.
    contactsFailed: list.data?.pages.some((p) => p.contactsFailed) ?? false,
    window,
  }
}
