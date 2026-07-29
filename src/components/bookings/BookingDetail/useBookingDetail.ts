import { useQuery } from "@tanstack/react-query"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback } from "react"

import { useBookingActions } from "@/hooks/useBookingActions"
import { useBookerContacts } from "@/hooks/useBookingsQuery"
import { useSessionGate } from "@/providers/SessionGateProvider"
import { getBookingById, type BookerContact } from "@/services/bookings.service"

export function useBookingDetail() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { gate } = useSessionGate()
  const vendorId = gate.selectedVendorId

  const contacts = useBookerContacts(vendorId)
  const actions = useBookingActions(vendorId)

  const query = useQuery({
    queryKey: ["booking", vendorId ?? "", id],
    enabled: Boolean(vendorId) && Boolean(id) && contacts.isSuccess,
    queryFn: () =>
      getBookingById(
        vendorId!,
        id!,
        contacts.data ?? new Map<string, BookerContact>(),
      ),
  })

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace("/bookings")
  }, [router])

  // Approve returns to the list: the vendor's job here is done, and staying on a
  // detail screen that has just lost its actions is a dead end. The undo lives
  // in the snackbar, which outlives the navigation.
  // Signature takes the booking so it matches `ApproveRejectBar`'s prop, but the
  // fetched row is used rather than the argument — they are the same row, and
  // reading from the query keeps the source of truth in one place.
  const approve = useCallback(() => {
    if (!query.data) return
    actions.approve(query.data)
    goBack()
  }, [actions, query.data, goBack])

  const approveBookingFromBar = useCallback(() => approve(), [approve])

  const reject = useCallback(
    async (_: unknown, reason: string) => {
      if (!query.data) return
      await actions.reject(query.data, reason)
      goBack()
    },
    [actions, query.data, goBack],
  )

  return {
    booking: query.data ?? null,
    isLoading: query.isLoading || contacts.isLoading,
    isError: query.isError || contacts.isError,
    refetch: query.refetch,
    approve: approveBookingFromBar,
    reject,
    goBack,
  }
}
