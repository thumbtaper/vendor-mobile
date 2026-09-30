import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // No horizontal inset (B1) — rendered inside the notifications list's
    // scrolling header, which already sits within the content container's
    // `spacing.xl` padding.
    card: {
      gap: spacing.sm,
      marginBottom: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.card,
      borderWidth: 1,
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
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
    },
    action: {
      marginTop: spacing.sm,
    },
  })
