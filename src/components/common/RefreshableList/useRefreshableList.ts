import { useCallback, useState } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { spacing, TAB_BAR_HEIGHT } from "@/theme/tokens"

// Pull-to-refresh must show its spinner even when the cache is warm and the
// refetch resolves instantly, or the gesture reads as broken (plan §5.2). The
// minimum visible duration is enforced here rather than in each screen.
const MIN_SPINNER_MS = 450

export function useRefreshableList(onRefresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false)
  const insets = useSafeAreaInsets()

  // I1 — the tab bar is `position: "absolute"`, so it floats over the list and
  // occupies no layout space. `styles.content`'s 24 was measured against nothing:
  // scrolled to the end, the last row sat under the bar.
  //
  // Composed rather than a single number so each part is accountable:
  //   TAB_BAR_HEIGHT  the bar's own body
  //   insets.bottom   the safe-area strip react-navigation draws beneath it
  //   spacing.xl      the breathing room the list already had, preserved above
  //                   the bar instead of being eaten by it
  const contentBottomPadding = TAB_BAR_HEIGHT + insets.bottom + spacing.xl

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

  return { refreshing, refresh, contentBottomPadding }
}
