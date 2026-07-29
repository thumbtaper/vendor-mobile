import { StyleSheet } from "react-native"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      justifyContent: "space-between",
    },
    scroll: {
      padding: spacing.xl,
      gap: spacing.lg,
    },
    centred: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xxl,
      gap: spacing.md,
    },
    card: {
      gap: spacing.md,
      padding: spacing.xl,
      borderRadius: radii.card,
      borderWidth: 1,
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
      ...t.cardShadow,
    },
    headline: {
      color: t.strong,
      fontSize: type.title.size,
      fontWeight: type.title.weight,
    },
    badge: {
      alignSelf: "flex-start",
      fontSize: type.caption.size,
      fontWeight: "700",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radii.pill,
      overflow: "hidden",
    },
    field: {
      gap: 2,
    },
    label: {
      color: t.text,
      fontSize: type.caption.size,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    value: {
      color: t.strong,
      fontSize: type.body.size,
      lineHeight: 21,
    },
    price: {
      color: t.strong,
      fontSize: type.stat.size,
      fontWeight: type.stat.weight,
    },
    message: {
      color: t.text,
      fontSize: type.body.size,
      textAlign: "center",
    },
  })
