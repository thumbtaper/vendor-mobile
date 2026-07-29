import { useQuery } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { useCallback } from "react"

import { useBookingsQuery } from "@/hooks/useBookingsQuery"
import { useSessionGate } from "@/providers/SessionGateProvider"
import { getDashboardStats } from "@/services/dashboard.service"
import type { Booking } from "@/lib/types"

export function useDashboardView() {
  const router = useRouter()
  const { gate } = useSessionGate()
  const vendorId = gate.selectedVendorId

  const stats = useQuery({
    // First key element matches `PERSISTED_KEYS` so the stats survive a cold
    // offline open (D11).
    queryKey: ["dashboard-stats", vendorId ?? ""],
    queryFn: () => getDashboardStats(vendorId!),
    enabled: Boolean(vendorId),
  })

  // The preview reuses the bookings query rather than a second fetch, so the
  // dashboard and the Bookings tab can never show a different pending list.
  const pending = useBookingsQuery(vendorId, "pending")

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
