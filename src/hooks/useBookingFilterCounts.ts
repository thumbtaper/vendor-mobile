import { useQuery } from "@tanstack/react-query"
import { useIsFocused } from "expo-router"

import {
  BADGED_FILTERS,
  statusesForFilter,
  type BookingFilterKey,
} from "@/lib/bookingFilters"
import { countBookingsWithStatuses } from "@/services/bookings.service"
import { POLL_MS } from "./useBookingsQuery"

export type FilterCounts = Partial<Record<BookingFilterKey, number>>

export function filterCountsQueryKey(vendorId: string) {
  // Shares the ["bookings", vendorId] PREFIX on purpose. `useBookingsRealtime`
  // and `useBookingActions` both invalidate on it, so the badges refresh whenever
  // the list does — without either of them needing to know this hook exists.
  //
  // Safe against `bookingsQueryKey`, which puts a comma-joined status list in the
  // same slot: no booking status is named "filter-counts".
  return ["bookings", vendorId, "filter-counts"] as const
}

/**
 * Counts for the badged filter chips.
 *
 * One HEAD request per badged group — two today. They are counted server-side
 * because this app pages the list, so the client never holds the full set (see
 * `countBookingsWithStatuses`).
 *
 * Failure is deliberately silent: a missing badge is a cosmetic loss, and an
 * error banner over a filter strip would be louder than the information is worth.
 * The list itself reports its own failures.
 */
export function useBookingFilterCounts(vendorId: string | null) {
  // Polls on the same I5 backstop as the list itself, and for a reason beyond
  // symmetry: if the list caught up on a tick and the badges did not, the screen
  // would show a contradiction — rows visible under "Needs you" while its chip
  // still reads the old number. A missing badge is cosmetic (see above); a badge
  // that disagrees with the list next to it is not.
  //
  // Fixed cost, unlike the list: one count per badged group, two today,
  // regardless of how far the vendor has paged.
  const isFocused = useIsFocused()

  const query = useQuery({
    queryKey: filterCountsQueryKey(vendorId ?? ""),
    enabled: Boolean(vendorId),
    refetchInterval: isFocused ? POLL_MS : false,
    queryFn: async (): Promise<FilterCounts> => {
      const entries = await Promise.all(
        BADGED_FILTERS.map(
          async (key) =>
            [
              key,
              await countBookingsWithStatuses(vendorId!, statusesForFilter(key)),
            ] as const,
        ),
      )
      return Object.fromEntries(entries) as FilterCounts
    },
  })

  return query.data ?? {}
}
