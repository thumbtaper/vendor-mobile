import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    form: {
      gap: spacing.lg,
    },
    header: {
      gap: spacing.xs,
      marginBottom: spacing.sm,
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
      lineHeight: 21,
    },
    notice: {
      backgroundColor: t.subBg,
      borderRadius: radii.md,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    noticeTitle: {
        ...typeface.semibold,
      color: t.strong,
      fontSize: type.body.size,
    },
    noticeBody: {
        ...typeface.regular,
      color: t.text,
      fontSize: type.body.size,
      lineHeight: 21,
    },
    errorText: {
        ...typeface.regular,
      color: "#ef4444",
      fontSize: type.body.size,
    },
  })
