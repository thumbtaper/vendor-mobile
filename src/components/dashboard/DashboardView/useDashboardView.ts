import { useQuery } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useBookingsQuery } from "@/hooks/useBookingsQuery"
import { defaultWindow, windowFor } from "@/lib/dateWindows"
import { useSessionGate } from "@/providers/SessionGateProvider"
import { getDashboardStats } from "@/services/dashboard.service"
import type { Booking, BookingStatus, DateWindow } from "@/lib/types"
import { spacing, TAB_BAR_HEIGHT } from "@/theme/tokens"

// Module-level constant, not an inline literal: a fresh array on every render
// would be a new query key each time and refetch forever.
const PENDING_ONLY: BookingStatus[] = ["pending"]

export function useDashboardView() {
  const router = useRouter()
  const { gate } = useSessionGate()
  const vendorId = gate.selectedVendorId
  const insets = useSafeAreaInsets()

  // Lazy initialiser, not `useState(defaultWindow())`: the eager form would
  // recompute the current month on every render and throw the result away.
  const [window, setWindowState] = useState<DateWindow>(() => defaultWindow())

  // `PeriodFilter` speaks `DateWindow | null` because the bookings list can clear
  // its period. This screen cannot: it renders no "All dates" chip, and every
  // stat needs SOME period to be about. The guard exists to meet the shared
  // contract, not to handle a state this screen can reach — hence ignoring null
  // rather than falling back to a default, which would look like a working
  // feature if the chip were ever added by mistake.
  const setWindow = useCallback((next: DateWindow | null) => {
    if (next) setWindowState(next)
  }, [])

  const stats = useQuery({
    // First key element matches `PERSISTED_KEYS` so the stats survive a cold
    // offline open (D11).
    //
    // ⚠️ The WINDOW IS PART OF THE KEY. Without it React Query would serve one
    // period's cached numbers under another period's label — the single most
    // likely way to get this feature wrong.
    //
    // The `["dashboard-stats", vendorId]` PREFIX is unchanged, which is what keeps
    // `useBookingActions` and `useBookingsRealtime` working: both invalidate on
    // that prefix, and prefix matching reaches every cached window at once.
    queryKey: ["dashboard-stats", vendorId ?? "", window.from, window.to],
    queryFn: () => getDashboardStats(vendorId!, window),
    enabled: Boolean(vendorId),
  })

  // The preview reuses the bookings query rather than a second fetch, so it
  // shares a cache prefix with the Bookings tab and refreshes with it.
  //
  // Strictly `["pending"]`, NOT the "Needs you" group. That group also contains
  // `returned`, but this card is labelled "Pending Approvals", its count is
  // `status = pending`, and its empty state reads "Nothing needs your approval" —
  // widening the list here would contradict all three.
  const pending = useBookingsQuery(vendorId, PENDING_ONLY)

  const refresh = useCallback(async () => {
    await Promise.all([stats.refetch(), pending.refetch()])
  }, [stats, pending])

  const openBooking = useCallback(
    (booking: Booking) =>
      router.push({ pathname: "/bookings/[id]", params: { id: booking.id } }),
    [router],
  )

  const openAllBookings = useCallback(() => router.push("/bookings"), [router])

  // The four card destinations (I5). Two of them land on a list that is WIDER
  // than the number tapped, and that is the resolved behaviour (D7), not a bug to
  // fix later:
  //
  //   Pending Approvals → "Needs you", which also contains `returned`. The
  //     narrowest chip available; a seventh chip is refused by
  //     `lib/bookingFilters.ts`.
  //   Today's Bookings  → "All" + today, which also contains `cancelled`, while
  //     the card's count excludes it.
  //
  // Both destinations show the filters they were given, so the vendor can see why
  // the list is wider rather than reading it as a wrong number.
  //
  // ⚠️ Pending deliberately carries NO window. Its count is unscoped by the same
  // correctness rule that keeps it unscoped in the service — sending the
  // dashboard's period would contradict the number the vendor just tapped.
  const openPending = useCallback(
    () => router.push({ pathname: "/bookings", params: { filter: "needs_you" } }),
    [router],
  )

  const openToday = useCallback(() => {
    const today = windowFor("today")
    router.push({
      pathname: "/bookings",
      params: { filter: "all", from: today.from, to: today.to },
    })
  }, [router])

  const openCompleted = useCallback(
    () =>
      router.push({
        pathname: "/bookings",
        params: { filter: "done", from: window.from, to: window.to },
      }),
    [router, window],
  )

  const openRevenue = useCallback(
    () =>
      router.push({
        pathname: "/transactions",
        params: { from: window.from, to: window.to },
      }),
    [router, window],
  )

  return {
    // I3 — this screen's scroll content used a STATIC bottom pad, so it cleared
    // the tab bar's body but not the safe-area strip beneath it: short by ~24 on
    // gesture navigation and ~48 on three-button. Same composition as
    // `useRefreshableList`, so every scroll surface in the app now clears the bar
    // by the same 24 rather than each guessing.
    contentBottomPadding: TAB_BAR_HEIGHT + insets.bottom + spacing.xl,
    window,
    setWindow,
    stats: stats.data ?? null,
    isLoading: stats.isLoading,
    isError: stats.isError,
    // Comes from the ACTIVE window's query, because the key it is read from now
    // includes the window (I3). Switching periods therefore switches to that
    // period's own freshness rather than reporting the previous one's.
    dataUpdatedAt: stats.dataUpdatedAt,
    isFetching: stats.isFetching,
    refresh,
    pendingPreview: pending.bookings.slice(0, 3),
    pendingLoading: pending.isLoading,
    openBooking,
    openAllBookings,
    openPending,
    openToday,
    openCompleted,
    openRevenue,
    vendorName: gate.selectedVendorName,
  }
}
