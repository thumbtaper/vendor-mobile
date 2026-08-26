import { useCallback, useMemo, useRef, useState } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"

const SHOW_AT_TOP_Y = 12
const HIDE_AFTER_Y = 56
const DIRECTION_THRESHOLD = 8
const SCROLL_EVENT_THROTTLE = 16

export function useScreenShell() {
  const [actionsVisible, setActionsVisible] = useState(true)
  const lastYRef = useRef(0)

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = Math.max(0, event.nativeEvent.contentOffset.y)
      const previous = lastYRef.current
      const delta = y - previous
      lastYRef.current = y

      if (y <= SHOW_AT_TOP_Y) {
        setActionsVisible(true)
        return
      }

      if (delta > DIRECTION_THRESHOLD && y > HIDE_AFTER_Y) {
        setActionsVisible(false)
        return
      }

      if (delta < -DIRECTION_THRESHOLD) setActionsVisible(true)
    },
    [],
  )

  const chrome = useMemo(
    () => ({
      onScroll,
      scrollEventThrottle: SCROLL_EVENT_THROTTLE,
    }),
    [onScroll],
  )

  return { actionsVisible, chrome }
}
