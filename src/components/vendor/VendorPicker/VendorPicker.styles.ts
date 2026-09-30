import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    list: {
      gap: spacing.md,
    },
    header: {
      gap: spacing.xs,
      marginBottom: spacing.lg,
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
    row: {
      minHeight: MIN_TOUCH_TARGET + spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.card,
      borderWidth: 1,
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
      ...t.cardShadow,
    },
    rowPressed: {
      opacity: 0.7,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.pillBg,
      borderWidth: 1,
      borderColor: t.pillBdr,
    },
    initials: {
      ...typeface.bold,
      color: t.strong,
      fontSize: type.label.size,
    },
    body: {
      flex: 1,
      gap: 2,
    },
    name: {
      ...typeface.semibold,
      color: t.strong,
      fontSize: type.body.size,
    },
    address: {
      ...typeface.regular,
      color: t.text,
      fontSize: type.caption.size,
    },
  })
