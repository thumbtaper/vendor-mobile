import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { AppState } from "react-native"

import { supabase } from "@/lib/supabase/client"
import { logChannelPayload, logChannelStatus } from "@/lib/realtimeLog"
import { contactsQueryKey } from "./useBookingsQuery"

const TAG = "bookings-realtime"

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

  useEffect(() => {
    if (!vendorId) return

    // Every cache a booking change can invalidate, in one list so a new query key
    // is added in exactly one place. All three are PREFIXES:
    //   - ["bookings", id]       list pages (all filter combinations) + chip counts
    //   - ["booking", id]        whichever detail screen is open (I3). A separate
    //                            first element, so the bookings prefix does NOT
    //                            reach it — an open booking used to never update
    //   - ["dashboard-stats", id] the stat tiles (I2), which until now were
    //                            invalidated by nothing at all, not even by the
    //                            vendor's own approve
    const invalidate = () => {
      for (const key of [
        ["bookings", vendorId],
        ["booking", vendorId],
        ["dashboard-stats", vendorId],
      ]) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    }

    const onChange = (payload: {
      eventType: string
      new: Record<string, unknown>
    }) => {
      logChannelPayload(TAG, payload.eventType, payload.new?.id)

      // I4 — an INSERT can come from a booker the contacts map has never seen,
      // and the row renders its name from that map (`bookings.service.ts:64`
      // falls back to ""). Ordering is not optional here: `useBookingsQuery`
      // CLOSES OVER `contacts.data`, and React Query does not re-run a query
      // when its queryFn identity changes — so invalidating both at once races,
      // the list usually wins, and the new row paints with a blank name that
      // reads as corrupt data rather than as loading.
      //
      // `.finally`, not `.then`: a contacts failure must not strand the list on
      // stale data. UPDATE skips this — it cannot introduce a new booker.
      if (payload.eventType === "INSERT") {
        queryClient
          .invalidateQueries({ queryKey: contactsQueryKey(vendorId) })
          .finally(invalidate)
        return
      }
      invalidate()
    }

    // ── B2: serialise create/remove so they can never overlap ────────────────
    //
    // `removeChannel` is ASYNCHRONOUS. The previous code nulled the ref and let
    // the next foreground call `supabase.channel()` with the same topic while the
    // old channel was still `leaving` — realtime-js then holds two channels on one
    // topic and the survivor can settle in a state that never delivers. On Android
    // this path fires on every permission dialog, notification shade pull and app
    // switch, so "worked, then quietly stopped" is the expected failure.
    //
    // `desired` records intent synchronously; `sync()` queues the reconciliation
    // onto a single chain. A rapid background→foreground collapses correctly
    // because by the time a queued step runs, `desired` already holds the latest
    // intent and the step becomes a no-op.
    let desired = false
    let current: ReturnType<typeof supabase.channel> | null = null
    let chain: Promise<void> = Promise.resolve()

    const open = () => {
      return supabase
        .channel(`bookings-${vendorId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bookings",
            filter: `vendor_id=eq.${vendorId}`,
          },
          onChange,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bookings",
            filter: `vendor_id=eq.${vendorId}`,
          },
          onChange,
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
  }, [vendorId, queryClient])
}
