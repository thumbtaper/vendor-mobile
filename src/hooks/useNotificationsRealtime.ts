import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { AppState } from "react-native"

import { PORTAL } from "@/lib/constants"
import { logChannelPayload, logChannelStatus } from "@/lib/realtimeLog"
import { supabase } from "@/lib/supabase/client"
import type { AppNotification } from "@/lib/types"
import { useSnackbar } from "@/providers/SnackbarProvider"
import {
  notificationsQueryKey,
  unreadCountQueryKey,
} from "./useNotificationsQuery"

const TAG = "notifications-realtime"

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

  useEffect(() => {
    if (!userId) return

    // B2 — identical create/remove serialisation to `useBookingsRealtime`; see
    // the full reasoning there. Kept inline rather than extracted into a shared
    // `useRealtimeChannel`: that is a structural refactor of the exact code B1 is
    // still diagnosing, so it waits (plan I6).
    let desired = false
    let current: ReturnType<typeof supabase.channel> | null = null
    let chain: Promise<void> = Promise.resolve()

    const open = () => {
      return supabase
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
            // Logged BEFORE the portal check: a booker-portal row arriving here
            // is proof the channel is alive, which is exactly what B1 needs to
            // know. Logging after the early return would hide that.
            logChannelPayload(TAG, "INSERT", row.id)
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
        .subscribe((status, error) => logChannelStatus(TAG, status, error))
    }

    const sync = () => {
      chain = chain.then(async () => {
        if (desired && !current) {
          current = open()
        } else if (!desired && current) {
          await supabase.removeChannel(current)
          current = null
        }
      })
    }

    desired = true
    sync()

    const sub = AppState.addEventListener("change", (state) => {
      desired = state === "active"
      sync()
    })

    return () => {
      sub.remove()
      desired = false
      sync()
    }
  }, [userId, queryClient, snackbar])
}
