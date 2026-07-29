import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    content: {
      padding: spacing.xl,
      gap: spacing.xl,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      color: t.text,
      fontSize: type.caption.size,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    card: {
      borderRadius: radii.card,
      borderWidth: 1,
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
      overflow: "hidden",
      ...t.cardShadow,
    },
    row: {
      minHeight: MIN_TOUCH_TARGET + spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.divider,
    },
    rowPressed: {
      backgroundColor: t.overlaySubtle,
    },
    rowLabel: {
      flex: 1,
      color: t.strong,
      fontSize: type.body.size,
    },
    rowValue: {
      color: t.text,
      fontSize: type.caption.size,
    },
    segmented: {
      flexDirection: "row",
      gap: spacing.xs,
      padding: spacing.xs,
      borderRadius: radii.md,
      backgroundColor: t.pillBg,
    },
    segment: {
      flex: 1,
      minHeight: MIN_TOUCH_TARGET - spacing.sm,
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
    danger: {
      color: "#ef4444",
    },
    footnote: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
  })
