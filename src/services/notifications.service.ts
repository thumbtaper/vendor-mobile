// Adapted from `vendor/services/notifications.service.ts`.
//
// Differences: pages are smaller (a phone shows ~8 rows, not 50), errors are
// thrown rather than swallowed into `[]` — the mobile UI has a real error state
// and cannot tell "no notifications" from "the request failed" if the service
// hides it — and mutations return void, throwing on failure, so optimistic
// updates have something to roll back on.

import { supabase } from "@/lib/supabase/client"
import { PORTAL } from "@/lib/constants"
import type { AppNotification } from "@/lib/types"

export const NOTIFICATIONS_PAGE_SIZE = 20

export interface NotificationsPage {
  notifications: AppNotification[]
  nextPage: number | null
}

export async function getNotificationsPage(
  page: number,
  archived: boolean,
): Promise<NotificationsPage> {
  const from = page * NOTIFICATIONS_PAGE_SIZE
  const to = from + NOTIFICATIONS_PAGE_SIZE - 1

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("portal", PORTAL)
    .eq("is_archived", archived)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to)

  if (error) throw error

  const rows = (data as AppNotification[] | null) ?? []
  return {
    notifications: rows,
    nextPage: rows.length === NOTIFICATIONS_PAGE_SIZE ? page + 1 : null,
  }
}

// Drives the tab badge. `head: true` asks PostgREST for the count without the
// rows — the badge needs a number, not 40 records.
export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("portal", PORTAL)
    .eq("is_read", false)
    .eq("is_archived", false)

  if (error) throw error
  return count ?? 0
}

export async function setReadStatus(id: string, isRead: boolean): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: isRead })
    .eq("id", id)
  if (error) throw error
}

export async function markAllAsRead(): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("portal", PORTAL)
    .eq("is_read", false)
    .eq("is_archived", false)
  if (error) throw error
}

export async function archiveNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_archived: true })
    .eq("id", id)
  if (error) throw error
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").delete().eq("id", id)
  if (error) throw error
}
