import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { AppState } from "react-native"

import { PORTAL } from "@/lib/constants"
import { supabase } from "@/lib/supabase/client"
import type { AppNotification } from "@/lib/types"
import { useSnackbar } from "@/providers/SnackbarProvider"
import {
  notificationsQueryKey,
  unreadCountQueryKey,
} from "./useNotificationsQuery"

// Ports the notifications subscription from `useAppShell.ts:238-265`, including
// its client-side portal check: postgres_changes accepts a single filter
// condition, so `user_id` is filtered server-side and `portal` here. Dropping
// that check would leak booker-portal notifications into the vendor app.
//
// Lifecycle matches the bookings channel (I6) — closed on background, reopened
// on foreground.
export function useNotificationsRealtime(userId: string | null) {
  const queryClient = useQueryClient()
  const snackbar = useSnackbar()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!userId) return

    const subscribe = () => {
      if (channelRef.current) return
      const channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as AppNotification
            if (row.portal !== PORTAL) return

            queryClient.invalidateQueries({
              queryKey: notificationsQueryKey(false),
            })
            queryClient.invalidateQueries({ queryKey: unreadCountQueryKey })

            // The arrival toast is the in-app stand-in for the push notification
            // Ph7 adds. Until then it is the only signal a vendor gets while
            // looking at another screen.
            snackbar.show({ message: row.title })
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("notifications realtime:", status)
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
  }, [userId, queryClient, snackbar])
}
