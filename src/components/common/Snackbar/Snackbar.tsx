import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./Snackbar.styles"

export interface SnackbarMessage {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
  tone?: "default" | "error"
}

// Pure display. Hand-rolled rather than `sonner-native` (D3) — it carries the
// approve Undo action, which is bespoke either way, and Reanimated is already in
// the template so this costs no dependency.
export function Snackbar({
  snack,
  tabBarInset = 0,
}: {
  snack: SnackbarMessage
  tabBarInset?: number
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const insets = useSafeAreaInsets()

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(140)}
      style={[styles.host, { paddingBottom: insets.bottom + tabBarInset + 12 }]}
      pointerEvents="box-none"
    >
      <View
        style={[styles.bar, snack.tone === "error" && styles.error]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Text style={styles.message}>{snack.message}</Text>
        {snack.actionLabel && snack.onAction ? (
          <Pressable
            onPress={snack.onAction}
            accessibilityRole="button"
            style={styles.action}
          >
            <Text style={styles.actionLabel}>{snack.actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  )
}
