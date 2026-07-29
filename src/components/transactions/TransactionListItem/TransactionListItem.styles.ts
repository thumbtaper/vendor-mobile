import { StyleSheet } from "react-native"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    row: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii.card,
      borderWidth: 1,
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
      ...t.cardShadow,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    headerBody: {
      flex: 1,
      gap: 2,
    },
    name: {
      color: t.strong,
      fontSize: type.body.size,
      fontWeight: "600",
    },
    meta: {
      color: t.text,
      fontSize: type.caption.size,
    },
    payout: {
      color: t.strong,
      fontSize: type.body.size,
      fontWeight: "700",
    },
    payoutExcluded: {
      color: t.text,
      textDecorationLine: "line-through",
    },
    breakdown: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.divider,
    },
    breakdownItem: {
      gap: 2,
    },
    breakdownLabel: {
      color: t.text,
      fontSize: type.caption.size,
    },
    breakdownValue: {
      color: t.strong,
      fontSize: type.caption.size,
      fontWeight: "600",
    },
    badge: {
      alignSelf: "flex-start",
      fontSize: 10,
      fontWeight: "700",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radii.pill,
      overflow: "hidden",
    },
    exclusion: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
  })
