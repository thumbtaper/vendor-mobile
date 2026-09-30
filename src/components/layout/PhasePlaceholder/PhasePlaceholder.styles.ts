import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
    },
    card: {
      gap: spacing.sm,
      padding: spacing.xl,
      borderRadius: radii.card,
      borderWidth: 1,
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
      alignItems: "center",
      ...t.cardShadow,
    },
    title: {
      ...typeface.semibold,
      color: t.strong,
      fontSize: type.body.size,
    },
    body: {
      ...typeface.regular,
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
      textAlign: "center",
    },
  })
