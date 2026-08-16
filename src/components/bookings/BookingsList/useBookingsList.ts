import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"

import { useBookingsQuery, type BookingFilter } from "@/hooks/useBookingsQuery"
import { BOOKING_FILTERS, statusesForFilter } from "@/lib/bookingFilters"
import { parseWindowParam } from "@/lib/dateWindows"
import { useBookingFilterCounts } from "@/hooks/useBookingFilterCounts"
import type { Booking, DateWindow } from "@/lib/types"
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

  // `null` = no date filter, which is what this screen has always done and what
  // the "All dates" chip returns to. NOT defaulted to the current month: that
  // would hide every older booking from a screen that has always shown them,
  // which is the kind of silent behaviour change the shared preset set was chosen
  // to avoid (D3). See D8.
  const [window, setWindow] = useState<DateWindow | null>(null)

  // The group -> statuses translation happens here, not in the service:
  // grouping is a UI concern. `all` resolves to [], i.e. no filter.
  const statuses = useMemo(() => statusesForFilter(filter), [filter])
  const query = useBookingsQuery(vendorId, statuses, window)

  // ── Drill-down arrivals (I2) ────────────────────────────────────────────────
  //
  // ⚠️ AN EFFECT, NOT A `useState` INITIALISER. expo-router keeps a tab mounted
  // once visited (`useBookingsQuery.ts:27`), so an initialiser runs ONCE EVER —
  // the first drill-down would apply and every one after it would silently do
  // nothing. That is the single most likely way to get this feature wrong, and it
  // is invisible to every machine check in this repo.
  //
  // ⚠️ THE PARAMS ARE CLEARED after being applied, which is what makes a repeat
  // drill-down work at all: without it the second push of the SAME params changes
  // no value, the effect does not re-run, and the screen ignores the tap. Clearing
  // also stops a stale filter re-applying when the vendor returns to this tab by
  // its own icon later.
  const params = useLocalSearchParams<{
    filter?: string
    from?: string
    to?: string
  }>()

  useEffect(() => {
    if (!params.filter && !params.from && !params.to) return

    const arrivingFilter = parseFilterParam(params.filter)
    // Validated, never cast: these can arrive from a deep link (B5). Anything
    // malformed leaves the current value alone rather than filtering to nothing.
    const arrivingWindow = parseWindowParam(params.from, params.to)

    /* eslint-disable react-hooks/set-state-in-effect --
     * The rule targets state DERIVED from props/state, which should be computed
     * during render instead. This is the other case: a one-shot sync from an
     * external navigation event into state the user then owns and edits.
     *
     * Deriving instead was considered and rejected. Making the params the source
     * of truth would mean converting the EXISTING, shipped status filter to
     * `router.setParams` as well — putting a working feature on a mechanism this
     * workspace has never verified on a device, to satisfy a lint heuristic.
     *
     * The two failure modes the rule guards against are both closed here: the
     * early return above means no arrival is a no-op, and clearing the params
     * below means each arrival applies exactly once, so this cannot loop.
     */
    if (arrivingFilter) setFilter(arrivingFilter)
    // An arrival that carries no window means "no period" — Pending Approvals
    // pushes exactly that, because its count is unscoped.
    setWindow(arrivingWindow)
    /* eslint-enable react-hooks/set-state-in-effect */

    router.setParams({ filter: undefined, from: undefined, to: undefined })
  }, [params.filter, params.from, params.to, router])
  // The bookings channel is NOT subscribed here. It lives at the tab layout
  // (`app/(app)/_layout.tsx`) alongside the notifications one, so a vendor
  // sitting on Dashboard still gets live rows (I1). Subscribing here as well
  // would open a second channel on the same topic.
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
    window,
    setWindow,
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

/**
 * A filter key from a route param, or `null`.
 *
 * Lives here rather than in `lib/bookingFilters.ts` on purpose: that file is a
 * line-for-line copy of the web portal's and carries a "edit both in the same
 * change" rule, so a mobile-only validator does not belong in it. It only READS
 * the shared table, which keeps this work inside `ezzy-vendor-mobile`.
 *
 * `useLocalSearchParams` hands back `string | string[]`, so the `typeof` check is
 * also what rejects a repeated `?filter=` from a deep link.
 */
function parseFilterParam(value: unknown): BookingFilter | null {
  if (typeof value !== "string") return null
  return BOOKING_FILTERS.some((f) => f.key === value)
    ? (value as BookingFilter)
    : null
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
