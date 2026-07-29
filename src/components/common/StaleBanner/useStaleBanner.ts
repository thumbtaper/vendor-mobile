import { useEffect, useState } from "react"

export interface StaleBannerInput {
  /** `dataUpdatedAt` from the query — 0 when nothing has ever loaded. */
  dataUpdatedAt: number
  isError: boolean
  isFetching: boolean
}

// Connectivity is derived from query state rather than read from the OS.
//
// A dedicated network library (NetInfo / expo-network) is NOT in the approved
// dependency list (§6), and adding one is a fresh approval gate. Deriving from
// "we have data, and the last refetch failed" covers the case the banner exists
// for — the vendor opened the app on a bad connection and is looking at saved
// data — without claiming to know the radio state.
export function useStaleBanner({
  dataUpdatedAt,
  isError,
  isFetching,
}: StaleBannerInput) {
  const [, forceTick] = useState(0)

  // The "last updated" label ages while the screen sits open; without a tick it
  // would still read "just now" ten minutes later.
  useEffect(() => {
    if (dataUpdatedAt === 0) return
    const id = setInterval(() => forceTick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [dataUpdatedAt])

  const hasCachedData = dataUpdatedAt > 0
  const visible = hasCachedData && isError && !isFetching

  return {
    visible,
    label: visible ? `Showing saved data · ${formatAge(dataUpdatedAt)}` : null,
  }
}

function formatAge(timestamp: number): string {
  const mins = Math.floor((Date.now() - timestamp) / 60_000)
  if (mins < 1) return "updated just now"
  if (mins < 60) return `updated ${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `updated ${hours}h ago`
  return `updated ${Math.floor(hours / 24)}d ago`
}
