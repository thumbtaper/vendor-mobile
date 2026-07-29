import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    chip: {
      minHeight: MIN_TOUCH_TARGET - 8,
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      borderRadius: radii.pill,
      borderWidth: 1,
      backgroundColor: t.pillBg,
      borderColor: t.pillBdr,
    },
    chipActive: {
      borderColor: "transparent",
    },
    label: {
      color: t.text,
      fontSize: type.caption.size,
      fontWeight: "600",
    },
    labelActive: {
      color: "#ffffff",
    },
    // Longhand: RN 0.86's types no longer expose `StyleSheet.absoluteFillObject`.
    gradient: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: radii.pill,
    },
  })
