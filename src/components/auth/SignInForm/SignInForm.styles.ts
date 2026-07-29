import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    form: {
      gap: spacing.lg,
    },
    heading: {
      color: t.strong,
      fontSize: type.title.size,
      fontWeight: type.title.weight,
    },
    subheading: {
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
      color: "#ef4444",
      fontSize: type.body.size,
    },
    link: {
      minHeight: MIN_TOUCH_TARGET,
      justifyContent: "center",
    },
    linkText: {
      color: "#2563eb",
      fontSize: type.body.size,
      fontWeight: "600",
    },
    footer: {
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    footerText: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
  })
