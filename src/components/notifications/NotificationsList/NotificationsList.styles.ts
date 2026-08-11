import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // No horizontal inset (B1) — rendered inside the list's scrolling header,
    // which already sits within the content container's `spacing.xl` padding.
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    segmented: {
      flexDirection: "row",
      gap: spacing.xs,
      padding: spacing.xs,
      borderRadius: radii.md,
      backgroundColor: t.pillBg,
      flex: 1,
    },
    segment: {
      flex: 1,
      minHeight: MIN_TOUCH_TARGET - spacing.md,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.sm,
    },
    segmentActive: {
      backgroundColor: t.cardBg,
      borderWidth: 1,
      borderColor: t.cardBdr,
    },
    segmentLabel: {
      color: t.text,
      fontSize: type.caption.size,
      fontWeight: "600",
    },
    segmentLabelActive: {
      color: t.strong,
    },
    readAll: {
      minHeight: MIN_TOUCH_TARGET,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
    },
    readAllLabel: {
      color: "#2563eb",
      fontSize: type.caption.size,
      fontWeight: "700",
    },
  })
