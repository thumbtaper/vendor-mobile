import { useQuery } from "@tanstack/react-query"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useBookingActions, type FulfilAction } from "@/hooks/useBookingActions"
import { useBookerContacts } from "@/hooks/useBookingsQuery"
import { useSessionGate } from "@/providers/SessionGateProvider"
import { getBookingById, type BookerContact } from "@/services/bookings.service"
import { TAB_BAR_HEIGHT } from "@/theme/tokens"

export function useBookingDetail() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { gate } = useSessionGate()
  const vendorId = gate.selectedVendorId
  const insets = useSafeAreaInsets()

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
  // Signature takes the booking so it matches `BookingActionBar`'s prop, but the
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

  // Deliberately does NOT goBack, unlike approve/reject above.
  //
  // Those navigate away because acting on a `pending` booking strips the screen
  // of every action, leaving a dead end with the undo stranded in a snackbar. A
  // fulfilment move does the opposite: the new state is the feedback the vendor
  // wants to see, and it usually brings its own on-screen Undo. Even the terminal
  // one — "Got it back" -> completed — is worth staying for, since that is the
  // moment the payout is released and the screen says so.
  const flag = useCallback(
    async (_: unknown, reason: string) => {
      if (!query.data) return
      await actions.flag(query.data, reason)
    },
    [actions, query.data],
  )

  const fulfil = useCallback(
    async (_: unknown, action: FulfilAction) => {
      if (!query.data) return
      await actions.fulfil(query.data, action)
    },
    [actions, query.data],
  )

  return {
    // B1 — the action bar is pinned to the bottom of a `space-between` wrapper,
    // and the tab bar is `position: "absolute"`, so it floats OVER that spot
    // occupying no layout space. Without this the Approve/Reject row was drawn
    // underneath it: ~73pt covered (49 bar + ~24 gesture inset) against a ~80pt
    // bar, and fully covered on three-button navigation. The buttons were always
    // there — nobody could see them.
    //
    // Read here rather than in `BookingDetail.tsx` so the render layer stays pure
    // (component-separation): it receives a number and applies it inline, which
    // is allowed precisely because the value is dynamic.
    bottomInset: insets.bottom + TAB_BAR_HEIGHT,
    booking: query.data ?? null,
    isLoading: query.isLoading || contacts.isLoading,
    isError: query.isError || contacts.isError,
    refetch: query.refetch,
    approve: approveBookingFromBar,
    reject,
    fulfil,
    flag,
    goBack,
  }
}
