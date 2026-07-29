import { StyleSheet } from "react-native"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minWidth: 150,
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radii.card,
      borderWidth: 1,
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
      ...t.cardShadow,
    },
    label: {
      color: t.text,
      fontSize: type.caption.size,
      fontWeight: "600",
    },
    value: {
      color: t.strong,
      fontSize: type.stat.size,
      fontWeight: type.stat.weight,
    },
    unavailable: {
      color: t.text,
      fontSize: type.title.size,
      fontWeight: type.title.weight,
    },
    sub: {
      color: t.text,
      fontSize: type.caption.size,
    },
    skeleton: {
      height: 28,
      borderRadius: radii.sm,
      backgroundColor: t.overlayFaint,
    },
    skeletonSub: {
      height: 12,
      width: "60%",
      borderRadius: radii.sm,
      backgroundColor: t.overlaySubtle,
    },
  })
