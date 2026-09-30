import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

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
        ...typeface.semibold,
      color: t.strong,
      fontSize: type.body.size,
    },
    meta: {
        ...typeface.regular,
      color: t.text,
      fontSize: type.caption.size,
    },
    payout: {
        ...typeface.bold,
      color: t.strong,
      fontSize: type.body.size,
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
        ...typeface.regular,
      color: t.text,
      fontSize: type.caption.size,
    },
    breakdownValue: {
        ...typeface.semibold,
      color: t.strong,
      fontSize: type.caption.size,
    },
    badge: {
        ...typeface.bold,
      alignSelf: "flex-start",
      fontSize: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radii.pill,
      overflow: "hidden",
    },
    exclusion: {
        ...typeface.regular,
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
  })
