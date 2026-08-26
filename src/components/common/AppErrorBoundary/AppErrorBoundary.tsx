import { TriangleAlert } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { styles } from "./AppErrorBoundary.styles"
import { useAppErrorBoundary } from "./useAppErrorBoundary"

// Props are expo-router's `ErrorBoundaryProps`, declared structurally rather
// than imported so this file has no dependency on the router.
interface Props {
  error: Error
  retry: () => Promise<void>
}

// The app's last-resort net for a render crash. Exported as `ErrorBoundary` from
// `app/_layout.tsx`, which is what expo-router looks for.
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// expo-router installs NO boundary of its own in production — `useScreens.js:146`
// wraps a route in `Try` only `if (ErrorBoundary)` is exported. Without this file
// a single bad render takes the whole app down with no message, which has already
// happened once: `NotificationListItem` destructured an exhaustive
// `Record<Union, …>` and four newer fulfilment notification types killed the
// Notifications screen, because the database can emit a value newer than an
// installed binary and no migration can recompile a phone (see AGENTS.md).
//
// ── WHAT IT MAY NOT DO ──────────────────────────────────────────────────────
// `Try` sits OUTSIDE the route component, so when this renders, `app/_layout.tsx`
// has not mounted and NONE of the providers exist. Three consequences, each of
// which would crash the boundary itself:
//   - no `useAppTheme()` — it throws without its provider, hence the static
//     palette in `.styles.ts`
//   - no `useSafeAreaInsets()` — it throws without `SafeAreaProvider`
//     (`SafeAreaContext.tsx:150-152`). `SafeAreaView` is fine: it is a pure
//     native component with no context dependency
//   - no `PrimaryButton`, `ScreenShell` or anything else that reads the theme
// Keep this component self-contained. Every import it gains is another thing
// that must survive the crash it is reporting.
//
// The splash is already dismissed by `Try.getDerivedStateFromError`, so unlike
// `ConfigErrorScreen` this needs no splash handling of its own.
export function AppErrorBoundary({ error, retry }: Props) {
  const { detail } = useAppErrorBoundary(error)

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <View style={styles.iconRing}>
            <TriangleAlert size={28} color="#f1f5f9" />
          </View>

          <Text style={styles.title} accessibilityRole="header">
            Something went wrong
          </Text>

          <Text style={styles.body}>
            The app hit an unexpected problem and had to stop what it was doing.
            Nothing you have done has been lost — your bookings and payouts are
            safe on the server. Trying again usually clears it.
          </Text>

          {detail ? (
            <View style={styles.detail} accessibilityLabel="Error detail">
              <Text style={styles.detailText}>{detail}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={retry}
            accessibilityRole="button"
            accessibilityHint="Reloads the app and tries again"
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonLabel}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  )
}
