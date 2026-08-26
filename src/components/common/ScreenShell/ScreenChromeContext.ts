import { createContext, useContext } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"

export interface ScreenChromeContextValue {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  scrollEventThrottle: number
}

const noop = () => {}

const FALLBACK: ScreenChromeContextValue = {
  onScroll: noop,
  scrollEventThrottle: 16,
}

export const ScreenChromeContext =
  createContext<ScreenChromeContextValue>(FALLBACK)

export function useScreenChrome(): ScreenChromeContextValue {
  return useContext(ScreenChromeContext)
}
