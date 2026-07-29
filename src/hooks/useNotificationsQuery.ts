import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

import type { AppNotification } from "@/lib/types"
import {
  archiveNotification,
  deleteNotification,
  getNotificationsPage,
  getUnreadCount,
  markAllAsRead,
  setReadStatus,
} from "@/services/notifications.service"

export function notificationsQueryKey(archived: boolean) {
  return ["notifications", archived ? "archived" : "inbox"] as const
}

export const unreadCountQueryKey = ["notifications-unread-count"] as const

export function useUnreadCount() {
  const query = useQuery({
    queryKey: unreadCountQueryKey,
    queryFn: getUnreadCount,
    staleTime: 30_000,
  })
  return query.data ?? 0
}

export function useNotificationsQuery(archived: boolean) {
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: notificationsQueryKey(archived),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getNotificationsPage(pageParam, archived),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })

  const notifications: AppNotification[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.notifications) ?? [],
    [query.data],
  )

  // Every mutation below is optimistic with an explicit rollback. These are
  // one-tap gestures on a list — waiting for a round trip before the row reacts
  // makes the whole surface feel broken on a slow connection.
  const patch = useCallback(
    (id: string, changes: Partial<AppNotification>) => {
      queryClient.setQueryData<{ pages: { notifications: AppNotification[] }[] }>(
        notificationsQueryKey(archived),
        (old) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notifications: page.notifications.map((n) =>
                n.id === id ? { ...n, ...changes } : n,
              ),
            })),
          }
        },
      )
    },
    [queryClient, archived],
  )

  const remove = useCallback(
    (id: string) => {
      queryClient.setQueryData<{ pages: { notifications: AppNotification[] }[] }>(
        notificationsQueryKey(archived),
        (old) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notifications: page.notifications.filter((n) => n.id !== id),
            })),
          }
        },
      )
    },
    [queryClient, archived],
  )

  const refreshUnread = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: unreadCountQueryKey })
  }, [queryClient])

  const toggleRead = useCallback(
    async (notification: AppNotification) => {
      const next = !notification.is_read
      patch(notification.id, { is_read: next })
      try {
        await setReadStatus(notification.id, next)
        refreshUnread()
      } catch {
        patch(notification.id, { is_read: notification.is_read })
      }
    },
    [patch, refreshUnread],
  )

  const archive = useCallback(
    async (notification: AppNotification) => {
      remove(notification.id)
      try {
        await archiveNotification(notification.id)
        refreshUnread()
        queryClient.invalidateQueries({ queryKey: notificationsQueryKey(true) })
      } catch {
        query.refetch()
      }
    },
    [remove, refreshUnread, queryClient, query],
  )

  const destroy = useCallback(
    async (notification: AppNotification) => {
      remove(notification.id)
      try {
        await deleteNotification(notification.id)
        refreshUnread()
      } catch {
        query.refetch()
      }
    },
    [remove, refreshUnread, query],
  )

  const readAll = useCallback(async () => {
    try {
      await markAllAsRead()
    } finally {
      query.refetch()
      refreshUnread()
    }
  }, [query, refreshUnread])

  return {
    ...query,
    notifications,
    toggleRead,
    archive,
    destroy,
    readAll,
  }
}
