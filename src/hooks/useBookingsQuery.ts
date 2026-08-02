import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { BookingFilterKey } from "@/lib/bookingFilters"
import type { Booking, BookingStatus } from "@/lib/types"
import {
  getBookerContacts,
  getBookingsPage,
  type BookerContact,
} from "@/services/bookings.service"

// Re-exported so the filter chips keep a name for what they select: a lifecycle
// GROUP, not a status. It used to be `BookingStatus | "all"`, which meant widening
// BookingStatus silently widened the filter too.
export type BookingFilter = BookingFilterKey

export function bookingsQueryKey(vendorId: string, statuses: BookingStatus[]) {
  // First element matches `PERSISTED_KEYS` in lib/queryClient.ts, so the bookings
  // list survives a cold start (D11). Keeping the ["bookings", vendorId] PREFIX
  // intact also matters for correctness, not just tidiness: `useBookingsRealtime`
  // and `useBookingActions` both invalidate on that prefix, so every cached
  // status combination refreshes together.
  //
  // The statuses are joined into one stable string rather than nested as an array
  // so that ["pending"] and ["pending"] from two call sites hash identically.
  return ["bookings", vendorId, statuses.join(",") || "all"] as const
}

export function contactsQueryKey(vendorId: string) {
  return ["booker-contacts", vendorId] as const
}

// Contacts are fetched once per vendor and shared by every page and the detail
// screen. They change far less often than bookings do.
export function useBookerContacts(vendorId: string | null) {
  return useQuery({
    queryKey: contactsQueryKey(vendorId ?? ""),
    queryFn: () => getBookerContacts(vendorId!),
    enabled: Boolean(vendorId),
    staleTime: 5 * 60_000,
  })
}

/**
 * Bookings for a vendor, filtered by an explicit list of statuses.
 *
 * Takes STATUSES rather than a filter key so that callers who want one specific
 * status are still expressible. The Bookings tab passes a lifecycle group
 * (`statusesForFilter(...)`); the dashboard passes `["pending"]`, because its card
 * is specifically "Pending Approvals" and counts `status = pending` — feeding it
 * the wider "Needs you" group would list `returned` bookings under an approvals
 * heading and disagree with the number printed above them.
 *
 * An empty array means no status filter at all.
 */
export function useBookingsQuery(
  vendorId: string | null,
  statuses: BookingStatus[],
) {
  const contacts = useBookerContacts(vendorId)

  const query = useInfiniteQuery({
    queryKey: bookingsQueryKey(vendorId ?? "", statuses),
    // Waiting for contacts keeps a page from rendering with blank booker names
    // and then filling in — a visible flash of anonymous rows.
    enabled: Boolean(vendorId) && contacts.isSuccess,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getBookingsPage(
        vendorId!,
        pageParam,
        statuses,
        contacts.data ?? new Map<string, BookerContact>(),
      ),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })

  const bookings: Booking[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.bookings) ?? [],
    [query.data],
  )

  return {
    ...query,
    bookings,
    // A contacts failure is a load failure: without it the list would render
    // every booker as blank, which looks like corrupt data rather than an error.
    isError: query.isError || contacts.isError,
    error: query.error ?? contacts.error,
    isLoading: query.isLoading || contacts.isLoading,
  }
}
