import { useCallback, useMemo, useState } from "react"

import {
  useTransactionsQuery,
  type WindowPreset,
} from "@/hooks/useTransactionsQuery"
import type { Transaction } from "@/lib/types"
import { useSessionGate } from "@/providers/SessionGateProvider"

export function useTransactionsView() {
  const { gate } = useSessionGate()
  const vendorId = gate.selectedVendorId
  const [preset, setPreset] = useState<WindowPreset>("this-month")
  const [search, setSearch] = useState("")

  const query = useTransactionsQuery(vendorId, preset)

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
    preset,
    setPreset,
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
