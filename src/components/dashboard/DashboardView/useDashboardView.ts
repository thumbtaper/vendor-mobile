import { useQuery } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { useCallback } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useBookingsQuery } from "@/hooks/useBookingsQuery"
import { useSessionGate } from "@/providers/SessionGateProvider"
import { getDashboardStats } from "@/services/dashboard.service"
import type { Booking, BookingStatus } from "@/lib/types"
import { spacing, TAB_BAR_HEIGHT } from "@/theme/tokens"

// Module-level constant, not an inline literal: a fresh array on every render
// would be a new query key each time and refetch forever.
const PENDING_ONLY: BookingStatus[] = ["pending"]

export function useDashboardView() {
  const router = useRouter()
  const { gate } = useSessionGate()
  const vendorId = gate.selectedVendorId
  const insets = useSafeAreaInsets()

  const stats = useQuery({
    // First key element matches `PERSISTED_KEYS` so the stats survive a cold
    // offline open (D11).
    queryKey: ["dashboard-stats", vendorId ?? ""],
    queryFn: () => getDashboardStats(vendorId!),
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

  return {
    // I3 — this screen's scroll content used a STATIC bottom pad, so it cleared
    // the tab bar's body but not the safe-area strip beneath it: short by ~24 on
    // gesture navigation and ~48 on three-button. Same composition as
    // `useRefreshableList`, so every scroll surface in the app now clears the bar
    // by the same 24 rather than each guessing.
    contentBottomPadding: TAB_BAR_HEIGHT + insets.bottom + spacing.xl,
    stats: stats.data ?? null,
    isLoading: stats.isLoading,
    isError: stats.isError,
    dataUpdatedAt: stats.dataUpdatedAt,
    isFetching: stats.isFetching,
    refresh,
    pendingPreview: pending.bookings.slice(0, 3),
    pendingLoading: pending.isLoading,
    openBooking,
    openAllBookings,
    vendorName: gate.selectedVendorName,
  }
}
