import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // `paddingBottom` is applied INLINE from `useSettingsList`'s `bottomInset`
    // and deliberately overrides the shorthand `padding` below — this screen sits
    // under the floating tab bar, which occupies no layout space (B2). Do not
    // reinstate a static bottom value: it cannot see the device's inset.
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
    probeContent: {
      gap: spacing.md,
      padding: spacing.lg,
    },
    probeCopy: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
    probeTarget: {
      color: t.strong,
      fontSize: type.caption.size,
      fontWeight: "600",
    },
    probeSuccess: {
      color: "#16a34a",
      fontSize: type.caption.size,
      lineHeight: 18,
    },
    probeError: {
      color: "#ef4444",
      fontSize: type.caption.size,
      lineHeight: 18,
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
