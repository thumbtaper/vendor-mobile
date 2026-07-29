import { LinearGradient } from "expo-linear-gradient"
import { useMemo } from "react"
import { ActivityIndicator, Pressable, Text } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./PrimaryButton.styles"

interface Props {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: "primary" | "secondary"
  accessibilityHint?: string
}

// Pure display — no state of its own. Reproduces the web's `.btn-primary`
// gradient, which has no RN/NativeWind equivalent and must go through
// expo-linear-gradient (plan §5.4).
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  accessibilityHint,
}: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const isInert = disabled || loading

  if (variant === "secondary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isInert}
        accessibilityRole="button"
        accessibilityState={{ disabled: isInert, busy: loading }}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [
          styles.secondary,
          pressed && styles.pressed,
          isInert && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={tokens.strong} />
        ) : (
          <Text style={styles.secondaryLabel}>{label}</Text>
        )}
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInert, busy: loading }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed,
        isInert && styles.disabled,
      ]}
    >
      <LinearGradient
        colors={tokens.btnPrimary.colors}
        start={tokens.btnPrimary.start}
        end={tokens.btnPrimary.end}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  )
}
