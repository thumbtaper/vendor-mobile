import { StyleSheet } from "react-native"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    card: {
      gap: spacing.sm,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.card,
      borderWidth: 1,
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
    },
    title: {
      color: t.strong,
      fontSize: type.body.size,
      fontWeight: "600",
    },
    body: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
    action: {
      marginTop: spacing.sm,
    },
  })
