import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useBottomInset } from "@/hooks/useBottomInset"

// Same key as the old inline guide card. A vendor who dismissed the guide should
// not be onboarded again just because the surface became a modal.
const HIDDEN_KEY = "ezzy.vendor.guideHidden"

export function useGuideModal() {
  const [hidden, setHidden] = useState<boolean | null>(null)
  const insets = useSafeAreaInsets()
  const bottomInset = useBottomInset({ tabBar: false })

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(HIDDEN_KEY).then((stored) => {
      if (!cancelled) setHidden(stored === "true")
    })
    return () => {
      cancelled = true
    }
  }, [])

  const close = useCallback(() => {
    setHidden(true)
    AsyncStorage.setItem(HIDDEN_KEY, "true")
  }, [])

  const open = useCallback(() => {
    setHidden(false)
    AsyncStorage.setItem(HIDDEN_KEY, "false")
  }, [])

  const toggle = useCallback(() => {
    if (hidden === false) close()
    else open()
  }, [hidden, open, close])

  return {
    visible: hidden === false,
    ready: hidden !== null,
    open,
    close,
    toggle,
    topInset: insets.top,
    bottomInset,
  }
}
