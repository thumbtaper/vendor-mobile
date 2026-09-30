import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    form: {
      gap: spacing.lg,
    },
    heading: {
        ...typeface.bold,
      color: t.strong,
      fontSize: type.title.size,
    },
    subheading: {
        ...typeface.regular,
      color: t.text,
      fontSize: type.body.size,
    },
    header: {
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    errorBanner: {
      backgroundColor: "rgba(239,68,68,0.1)",
      borderColor: "rgba(239,68,68,0.35)",
      borderWidth: 1,
      borderRadius: radii.md,
      padding: spacing.md,
    },
    errorText: {
        ...typeface.regular,
      color: "#ef4444",
      fontSize: type.body.size,
    },
    link: {
      minHeight: MIN_TOUCH_TARGET,
      justifyContent: "center",
    },
    linkText: {
        ...typeface.semibold,
      // Tokenised so the branded auth surface renders these gold, as the web's
      // `.forgotLink` / `.signupLink` do.
      color: t.accent,
      fontSize: type.body.size,
    },
    footer: {
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    footerText: {
        ...typeface.regular,
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
  })
