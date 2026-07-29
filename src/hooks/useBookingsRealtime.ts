import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { AppState } from "react-native"

import { supabase } from "@/lib/supabase/client"

// Ports the bookings subscription from `useAppShell.ts:180-225` with the mobile
// lifecycle the web has no equivalent for (I6).
//
// The web app holds one socket for as long as the tab is open. A phone
// backgrounds constantly, and a socket left open there is either killed by the
// OS or burns battery — so the channel is torn down on background and rebuilt on
// foreground, where TanStack Query's focus refetch has already re-synced the
// list anyway.
//
// Both INSERT and UPDATE invalidate rather than patch. The web patches UPDATEs
// into local state, but here the cache is paged and filtered across several
// query keys; recomputing which pages a row belongs to after a status change is
// more error-prone than refetching, and the payload lacks the joined offering,
// schedule and RPC-sourced contact fields in any case.
export function useBookingsRealtime(vendorId: string | null) {
  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!vendorId) return

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", vendorId] })
    }

    const subscribe = () => {
      if (channelRef.current) return
      const channel = supabase
        .channel(`bookings-${vendorId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bookings",
            filter: `vendor_id=eq.${vendorId}`,
          },
          invalidate,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bookings",
            filter: `vendor_id=eq.${vendorId}`,
          },
          invalidate,
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("bookings realtime:", status)
          }
        })
      channelRef.current = channel
    }

    const unsubscribe = () => {
      if (!channelRef.current) return
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    subscribe()

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") subscribe()
      else unsubscribe()
    })

    return () => {
      sub.remove()
      unsubscribe()
    }
  }, [vendorId, queryClient])
}
