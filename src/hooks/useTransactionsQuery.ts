import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { phCurrentMonthRange, phToday } from "@/lib/format"
import type { Transaction } from "@/lib/types"
import { useBookerContacts } from "./useBookingsQuery"
import type { BookerContact } from "@/services/bookings.service"
import {
  getTransactionTotals,
  getTransactionsPage,
  type DateWindow,
} from "@/services/transactions.service"

export type WindowPreset = "this-month" | "last-3-months" | "last-12-months"

export const WINDOW_PRESETS: { value: WindowPreset; label: string }[] = [
  { value: "this-month", label: "This month" },
  { value: "last-3-months", label: "3 months" },
  { value: "last-12-months", label: "12 months" },
]

// No "all time" preset: an unbounded window is exactly what D9 avoids. The
// longest option is a year, which is bounded and predictable.
export function windowFor(preset: WindowPreset): DateWindow {
  const to = phToday()
  if (preset === "this-month") return phCurrentMonthRange()

  const months = preset === "last-3-months" ? 3 : 12
  const d = new Date(`${to}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() - months)
  return { from: d.toISOString().slice(0, 10), to }
}

export function useTransactionsQuery(
  vendorId: string | null,
  preset: WindowPreset,
) {
  const window = useMemo(() => windowFor(preset), [preset])
  const contacts = useBookerContacts(vendorId)

  const list = useInfiniteQuery({
    // First key element matches `PERSISTED_KEYS` so the first page survives a
    // cold offline open (D11).
    queryKey: ["transactions-first-page", vendorId ?? "", preset],
    enabled: Boolean(vendorId) && contacts.isSuccess,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getTransactionsPage(
        vendorId!,
        pageParam,
        window,
        contacts.data ?? new Map<string, BookerContact>(),
      ),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })

  const totals = useQuery({
    queryKey: ["transaction-totals", vendorId ?? "", preset],
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
    contactsFailed: contacts.isError,
    window,
  }
}
