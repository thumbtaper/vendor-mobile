import { useCallback, useState } from "react"

// Pull-to-refresh must show its spinner even when the cache is warm and the
// refetch resolves instantly, or the gesture reads as broken (plan §5.2). The
// minimum visible duration is enforced here rather than in each screen.
const MIN_SPINNER_MS = 450

export function useRefreshableList(onRefresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    const startedAt = Date.now()
    try {
      await onRefresh()
    } finally {
      const elapsed = Date.now() - startedAt
      if (elapsed < MIN_SPINNER_MS) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_SPINNER_MS - elapsed),
        )
      }
      setRefreshing(false)
    }
  }, [onRefresh, refreshing])

  return { refreshing, refresh }
}
