import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { Booking, BookingStatus } from "@/lib/types"
import {
  getBookerContacts,
  getBookingsPage,
  type BookerContact,
} from "@/services/bookings.service"

export type BookingFilter = BookingStatus | "all"

export function bookingsQueryKey(vendorId: string, filter: BookingFilter) {
  // First element matches `PERSISTED_KEYS` in lib/queryClient.ts, so the bookings
  // list survives a cold start (D11).
  return ["bookings", vendorId, filter] as const
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

export function useBookingsQuery(
  vendorId: string | null,
  filter: BookingFilter,
) {
  const contacts = useBookerContacts(vendorId)

  const query = useInfiniteQuery({
    queryKey: bookingsQueryKey(vendorId ?? "", filter),
    // Waiting for contacts keeps a page from rendering with blank booker names
    // and then filling in — a visible flash of anonymous rows.
    enabled: Boolean(vendorId) && contacts.isSuccess,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getBookingsPage(
        vendorId!,
        pageParam,
        filter,
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
