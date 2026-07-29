import { useCallback, useState } from "react"

import { useNotificationsQuery } from "@/hooks/useNotificationsQuery"

// The realtime subscription deliberately does NOT live here. Tab screens only
// mount on first visit, so subscribing from this hook would mean no arrival
// toast and no badge updates until the vendor had opened the Alerts tab once —
// exactly backwards for the feature the app exists to deliver. It is mounted in
// `(app)/_layout.tsx` instead, which is alive for the whole session.
export function useNotificationsList() {
  const [archived, setArchived] = useState(false)

  const query = useNotificationsQuery(archived)

  const refresh = useCallback(async () => {
    await query.refetch()
  }, [query])

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage()
  }, [query])

  const hasUnread = query.notifications.some((n) => !n.is_read)

  return {
    archived,
    setArchived,
    notifications: query.notifications,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.isError
      ? "Couldn't load your notifications. Pull to try again."
      : null,
    dataUpdatedAt: query.dataUpdatedAt,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    refresh,
    loadMore,
    toggleRead: query.toggleRead,
    archive: query.archive,
    destroy: query.destroy,
    readAll: query.readAll,
    hasUnread,
    emptyTitle: archived ? "Nothing archived" : "Nothing new",
    emptyBody: archived
      ? "Notifications you archive will appear here."
      : "Bookings, payments and account updates will show up here.",
  }
}
