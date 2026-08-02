import { useRouter } from "expo-router"
import { useCallback, useMemo, useState } from "react"

import { useBookingsQuery, type BookingFilter } from "@/hooks/useBookingsQuery"
import { statusesForFilter } from "@/lib/bookingFilters"
import { useBookingFilterCounts } from "@/hooks/useBookingFilterCounts"
import { useBookingsRealtime } from "@/hooks/useBookingsRealtime"
import type { Booking } from "@/lib/types"
import { useSessionGate } from "@/providers/SessionGateProvider"

// Per-filter copy, not one generic empty state (plan §5.1). Keyed by the six
// lifecycle GROUPS, replacing the status-keyed scaffolding this map briefly held
// between B2 and I8.
//
// An empty group is usually good news for a vendor, so the copy says so rather
// than reporting an absence — "You're all caught up" beats "No bookings found".
const EMPTY_COPY: Record<BookingFilter, { title: string; body?: string }> = {
  needs_you: {
    title: "You're all caught up",
    body: "Nothing is waiting on you right now.",
  },
  active: {
    title: "Nothing in progress",
    body: "Bookings you've approved will appear here until they're finished.",
  },
  done: { title: "No completed bookings yet" },
  issues: {
    title: "No flagged bookings",
    body: "Bookings put on hold for Ezzy to review would show up here.",
  },
  closed: { title: "Nothing cancelled or refunded" },
  all: {
    title: "No bookings yet",
    body: "New bookings from customers will appear here.",
  },
}

export function useBookingsList() {
  const router = useRouter()
  const { gate } = useSessionGate()
  const vendorId = gate.selectedVendorId
  const [filter, setFilter] = useState<BookingFilter>("needs_you")

  // The group -> statuses translation happens here, not in the service:
  // grouping is a UI concern. `all` resolves to [], i.e. no filter.
  const statuses = useMemo(() => statusesForFilter(filter), [filter])
  const query = useBookingsQuery(vendorId, statuses)
  useBookingsRealtime(vendorId)
  const filterCounts = useBookingFilterCounts(vendorId)

  const refresh = useCallback(async () => {
    await query.refetch()
  }, [query])

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage()
  }, [query])

  const openBooking = useCallback(
    (booking: Booking) =>
      router.push({
        pathname: "/bookings/[id]",
        params: { id: booking.id },
      }),
    [router],
  )

  return {
    filter,
    setFilter,
    bookings: query.bookings,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? describeError(query.error) : null,
    dataUpdatedAt: query.dataUpdatedAt,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    refresh,
    loadMore,
    openBooking,
    empty: EMPTY_COPY[filter],
    filterCounts,
    vendorName: gate.selectedVendorName,
  }
}

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  // Distinguishing offline from a server error changes what the user should do
  // next, so the two are not collapsed into one message (plan §5.1).
  if (/network|fetch|timeout/i.test(message)) {
    return "Can't reach the server. Check your connection."
  }
  return "Something went wrong loading your bookings."
}
