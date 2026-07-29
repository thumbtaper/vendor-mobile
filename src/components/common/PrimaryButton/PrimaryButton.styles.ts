import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    pressable: {
      minHeight: MIN_TOUCH_TARGET,
      borderRadius: radii.md,
      overflow: "hidden",
      ...t.btnPrimaryShadow,
    },
    gradient: {
      flex: 1,
      minHeight: MIN_TOUCH_TARGET,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    label: {
      color: "#ffffff",
      fontSize: type.body.size,
      fontWeight: "600",
    },
    pressed: {
      opacity: 0.85,
    },
    disabled: {
      opacity: 0.5,
    },
    // Secondary variant: no gradient, just the app's text colour on a bordered pill.
    secondary: {
      minHeight: MIN_TOUCH_TARGET,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: t.pillBdr,
      backgroundColor: t.pillBg,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
    },
    secondaryLabel: {
      color: t.strong,
      fontSize: type.body.size,
      fontWeight: "600",
    },
  })
