import { useInfiniteQuery } from "@tanstack/react-query"
import { useIsFocused } from "expo-router"
import { useMemo } from "react"

import type { BookingFilterKey } from "@/lib/bookingFilters"
import type { Booking, BookingStatus, DateWindow } from "@/lib/types"
import { getBookingsPage } from "@/services/bookings.service"

// Re-exported so the filter chips keep a name for what they select: a lifecycle
// GROUP, not a status. It used to be `BookingStatus | "all"`, which meant widening
// BookingStatus silently widened the filter too.
export type BookingFilter = BookingFilterKey

// I5 — backstop for a degraded socket (D1: 60s).
//
// Realtime is the PRIMARY mechanism; this exists because a phone loses long-lived
// sockets in ways that produce no `CHANNEL_ERROR` at all — carrier NAT timeouts,
// captive portals, Doze. Without it the only recovery is app foreground or a
// manual pull, which is the failure this plan set out to remove.
//
// Two things bound the cost, and both matter:
//   - SCREEN focus, via `useIsFocused` — a mounted-but-hidden tab does not poll,
//     and expo-router keeps tabs mounted once visited, so this is not optional
//   - APP focus, via TanStack's own `refetchInterval` check against
//     `focusManager` (wired to AppState in `lib/queryClient.ts`). A backgrounded
//     app therefore does not poll, and `refetchIntervalInBackground` is left at
//     its default `false` deliberately — push (Ph7) is the background channel
//
// Known cost: refetching an infinite query refetches EVERY page already loaded,
// so a vendor who has scrolled to page 3 spends 4 requests per tick rather than
// 1. Accepted rather than engineered around — the list is ordered `created_at
// desc`, so new bookings land on page 0 and deep paging is both rare and
// short-lived. If it ever shows up in practice, `maxPages` is the lever.
export const POLL_MS = 60_000

export function bookingsQueryKey(
  vendorId: string,
  statuses: BookingStatus[],
  window?: DateWindow | null,
) {
  // First element matches `PERSISTED_KEYS` in lib/queryClient.ts, so the bookings
  // list survives a cold start (D11). Keeping the ["bookings", vendorId] PREFIX
  // intact also matters for correctness, not just tidiness: `useBookingsRealtime`
  // and `useBookingActions` both invalidate on that prefix, so every cached
  // status combination refreshes together.
  //
  // The statuses are joined into one stable string rather than nested as an array
  // so that ["pending"] and ["pending"] from two call sites hash identically.
  const base = ["bookings", vendorId, statuses.join(",") || "all"] as const

  // The window is APPENDED, never substituted — otherwise a period's cached page
  // would be served for a different one. Absent when there is no date filter,
  // which keeps the unfiltered list's key byte-identical to what it was before
  // periods existed, so no cache is orphaned by this change and
  // `isDefaultWindowKey` reads it as "no window" and persists it as before.
  return window ? ([...base, window.from, window.to] as const) : base
}

// `contactsQueryKey` and `useBookerContacts` are GONE (unbounded-queries B2).
//
// They cached one unfiltered fetch of every contact a vendor has and threaded the
// resulting map into every page. That is what hit PostgREST's 1000-row cap on the
// RPC: past 1000 distinct bookers the map was short and affected rows rendered
// anonymous. Each page now resolves contacts for its own ≤20 bookers inside
// `getBookingsPage`, so there is no shared map to cache, no cap to reach, and no
// `enabled` gate waiting on a second query.

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
 *
 * `window` is optional for the same reason: the dashboard's pending preview and a
 * drill-down from "Pending Approvals" both want the live queue, not a period.
 */
export function useBookingsQuery(
  vendorId: string | null,
  statuses: BookingStatus[],
  window?: DateWindow | null,
) {
  // Scoped to the SCREEN this hook is mounted in, which is what makes one poll
  // per minute the whole-app cost: the Bookings tab and the Dashboard preview
  // each call this hook, but only the focused one ticks.
  const isFocused = useIsFocused()

  const query = useInfiniteQuery({
    queryKey: bookingsQueryKey(vendorId ?? "", statuses, window),
    refetchInterval: isFocused ? POLL_MS : false,
    // No longer gated on a contacts query. The page resolves its own contacts
    // before resolving, so a row never renders anonymous and then fills in — the
    // flash the old `enabled` gate existed to prevent is now impossible by
    // construction rather than by sequencing.
    enabled: Boolean(vendorId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getBookingsPage(vendorId!, pageParam, statuses, window),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })

  const bookings: Booking[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.bookings) ?? [],
    [query.data],
  )

  return {
    ...query,
    bookings,
    // A contacts failure is still a load failure — it now arrives as the page
    // query's own error, because `getBookingsPage` lets it throw. The merging
    // that used to combine two queries' states is gone with the second query.
    isError: query.isError,
    error: query.error,
    isLoading: query.isLoading,
  }
}
