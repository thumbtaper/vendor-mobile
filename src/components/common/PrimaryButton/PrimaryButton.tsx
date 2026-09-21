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
  size?: "default" | "compact" | "large"
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
  size = "default",
  accessibilityHint,
}: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const isInert = disabled || loading
  const isLarge = size === "large"
  const isCompact = size === "compact"

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
          isLarge && styles.secondaryLarge,
          isCompact && styles.secondaryCompact,
          pressed && styles.pressed,
          isInert && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={tokens.strong} />
        ) : (
          <Text style={[styles.secondaryLabel, isLarge && styles.secondaryLabelLarge, isCompact && styles.secondaryLabelCompact]}>{label}</Text>
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
        isLarge && styles.pressableLarge,
        isCompact && styles.pressableCompact,
        pressed && styles.pressed,
        isInert && styles.disabled,
      ]}
    >
      <LinearGradient
        colors={tokens.btnPrimary.colors}
        start={tokens.btnPrimary.start}
        end={tokens.btnPrimary.end}
        style={[styles.gradient, isLarge && styles.gradientLarge, isCompact && styles.gradientCompact]}
      >
        {loading ? (
          // Same reason as `styles.label`: white would all but vanish on the gold
          // button the branded auth surface uses.
          <ActivityIndicator color={tokens.btnPrimaryFg} />
        ) : (
          <Text style={[styles.label, isLarge && styles.labelLarge, isCompact && styles.labelCompact]}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  )
}
