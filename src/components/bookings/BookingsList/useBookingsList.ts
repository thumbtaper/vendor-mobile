import { useRouter } from "expo-router"
import { useCallback, useState } from "react"

import { useBookingsQuery, type BookingFilter } from "@/hooks/useBookingsQuery"
import { useBookingsRealtime } from "@/hooks/useBookingsRealtime"
import type { Booking } from "@/lib/types"
import { useSessionGate } from "@/providers/SessionGateProvider"

const EMPTY_COPY: Record<BookingFilter, { title: string; body?: string }> = {
  // Per-filter copy, not one generic empty state (plan §5.1).
  pending: {
    title: "You're all caught up",
    body: "No bookings are waiting for your approval.",
  },
  confirmed: { title: "No confirmed bookings" },
  completed: { title: "No completed bookings yet" },
  cancelled: { title: "No cancelled bookings" },
  // No chip offers this filter today, but `refunded` is a real booking status —
  // the exhaustive map means adding the chip needs no second edit here.
  refunded: { title: "No refunded bookings" },
  all: {
    title: "No bookings yet",
    body: "New bookings from customers will appear here.",
  },
}

export function useBookingsList() {
  const router = useRouter()
  const { gate } = useSessionGate()
  const vendorId = gate.selectedVendorId
  const [filter, setFilter] = useState<BookingFilter>("pending")

  const query = useBookingsQuery(vendorId, filter)
  useBookingsRealtime(vendorId)

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
