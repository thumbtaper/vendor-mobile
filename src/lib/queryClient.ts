import AsyncStorage from "@react-native-async-storage/async-storage"
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query"
import { AppState, type AppStateStatus } from "react-native"

// Query keys that survive a cold start (D11). Everything else is memory-only.
//
// The persisted cache is a convenience for opening the app offline, not a
// mirror of the database: it holds the dashboard stats, the bookings list and
// the first page of transactions. Notification bodies, booking details and
// deeper transaction pages are refetched, which keeps the on-disk footprint of
// booker PII bounded.
const PERSISTED_KEYS = ["dashboard-stats", "bookings", "transactions-first-page"]

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A phone loses connectivity constantly; failing on the first blip and
      // showing an error state is worse than a short backoff.
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      staleTime: 30_000,
      gcTime: ONE_DAY_MS,
      // Handled by the AppState focus manager below rather than by the web
      // default, which keys off window focus events RN does not have.
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Approve/reject is a server-validated state transition. Retrying one
      // automatically can re-send an action the server already rejected as an
      // illegal transition (B4), so mutations get exactly one attempt.
      retry: 0,
    },
  },
})

// The session cache is keyed to a user and a vendor. Signing out or switching
// vendors must drop it, or the next user opens the app to someone else's
// bookings (D11).
export async function purgePersistedCache(): Promise<void> {
  queryClient.clear()
  await AsyncStorage.removeItem(CACHE_KEY)
}

const CACHE_KEY = "ezzy.vendor.queryCache"

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CACHE_KEY,
  throttleTime: 2000,
})

export const persistOptions = {
  persister,
  maxAge: ONE_DAY_MS,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) =>
      PERSISTED_KEYS.includes(String(query.queryKey[0])),
  },
} as const

// React Native has no window focus event. Without this, a vendor who backgrounds
// the app for hours reopens it to stale bookings and no refetch — the single most
// important "modern mobile" behaviour in the plan (§5.2).
export function startFocusTracking(): () => void {
  const onChange = (status: AppStateStatus) => {
    focusManager.setFocused(status === "active")
  }
  const sub = AppState.addEventListener("change", onChange)
  return () => sub.remove()
}

// `onlineManager` defaults to a browser navigator check. Ph2 wires this to
// NetInfo when the offline banner lands; until then the manager stays optimistic,
// which is the same behaviour as no wiring at all.
export { onlineManager }
