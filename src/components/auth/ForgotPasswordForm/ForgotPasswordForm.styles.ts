import { StyleSheet } from "react-native"

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
      color: t.strong,
      fontSize: type.title.size,
      fontWeight: type.title.weight,
    },
    subheading: {
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
      color: t.strong,
      fontSize: type.body.size,
      fontWeight: "600",
    },
    noticeBody: {
      color: t.text,
      fontSize: type.body.size,
      lineHeight: 21,
    },
    errorText: {
      color: "#ef4444",
      fontSize: type.body.size,
    },
  })
