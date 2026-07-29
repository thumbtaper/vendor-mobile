import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    toolbar: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    presets: {
      flexDirection: "row",
      gap: spacing.xs,
      padding: spacing.xs,
      borderRadius: radii.md,
      backgroundColor: t.pillBg,
    },
    preset: {
      flex: 1,
      minHeight: MIN_TOUCH_TARGET - spacing.md,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.sm,
    },
    presetActive: {
      backgroundColor: t.cardBg,
      borderWidth: 1,
      borderColor: t.cardBdr,
    },
    presetLabel: {
      color: t.text,
      fontSize: type.caption.size,
      fontWeight: "600",
    },
    presetLabelActive: {
      color: t.strong,
    },
    note: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.sm,
    },
  })
