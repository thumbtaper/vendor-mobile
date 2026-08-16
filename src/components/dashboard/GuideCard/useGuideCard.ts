import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState } from "react"

const HIDDEN_KEY = "ezzy.vendor.guideHidden"

/**
 * Whether the getting-started guide is showing, persisted across launches.
 *
 * `hidden` is `boolean | null`, and the `null` is the whole point. The stored
 * preference is read asynchronously, so a plain `useState(false)` would render
 * the guide for a frame on EVERY cold start — flashing the card at the one
 * vendor who explicitly hid it, which is the most annoying possible way for a
 * Hide button to fail. `null` means "not known yet" and the card renders nothing
 * until the read lands.
 *
 * Same shape as `AppThemeProvider`'s preference read, including the cancellation
 * flag and the fire-and-forget write: a failed write costs the vendor their
 * choice on the next launch, which is not worth blocking the UI on.
 */
export function useGuideCard() {
  const [hidden, setHidden] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(HIDDEN_KEY).then((stored) => {
      if (!cancelled) setHidden(stored === "true")
    })
    return () => {
      cancelled = true
    }
  }, [])

  const hide = useCallback(() => {
    setHidden(true)
    AsyncStorage.setItem(HIDDEN_KEY, "true")
  }, [])

  const show = useCallback(() => {
    setHidden(false)
    AsyncStorage.setItem(HIDDEN_KEY, "false")
  }, [])

  // The header's guide button is a toggle, so it needs one handler rather than a
  // caller deciding which of the two to call.
  //
  // ⚠️ `null` (preference not read yet) is treated as "currently showing", so the
  // first tap hides. That matches what is on screen: the card defaults to visible,
  // and a tap that appeared to do nothing would be worse than one that acts on the
  // visible state. The window where this matters is the few milliseconds before
  // AsyncStorage resolves.
  const toggle = useCallback(() => {
    if (hidden) show()
    else hide()
  }, [hidden, show, hide])

  return { hidden, hide, show, toggle }
}
