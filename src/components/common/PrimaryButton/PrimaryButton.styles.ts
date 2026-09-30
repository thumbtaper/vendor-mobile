import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    pressable: {
      minHeight: MIN_TOUCH_TARGET,
      borderRadius: radii.md,
      overflow: "hidden",
      ...t.btnPrimaryShadow,
    },
    pressableLarge: {
      minHeight: 88,
    },
    pressableCompact: {
      alignSelf: "center",
      minHeight: MIN_TOUCH_TARGET,
      width: "88%",
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
    gradientLarge: {
      minHeight: 88,
      paddingHorizontal: spacing.xl,
    },
    gradientCompact: {
      minHeight: MIN_TOUCH_TARGET,
      paddingHorizontal: spacing.md,
    },
    label: {
        ...typeface.semibold,
      // Tokenised, not white: on the branded auth surface `btnPrimary` is gold,
      // where white text is unreadable.
      color: t.btnPrimaryFg,
      fontSize: type.body.size,
    },
    labelLarge: {
        ...typeface.regular,
      fontSize: 18,
    },
    labelCompact: {
        ...typeface.regular,
      fontSize: 15,
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
    secondaryLarge: {
      minHeight: 88,
      paddingHorizontal: spacing.xl,
    },
    secondaryCompact: {
      alignSelf: "center",
      minHeight: MIN_TOUCH_TARGET,
      width: "88%",
    },
    secondaryLabel: {
        ...typeface.semibold,
      color: t.strong,
      fontSize: type.body.size,
    },
    secondaryLabelLarge: {
        ...typeface.regular,
      fontSize: 18,
    },
    secondaryLabelCompact: {
        ...typeface.regular,
      fontSize: 15,
    },
  })
