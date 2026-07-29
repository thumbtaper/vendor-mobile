import { StyleSheet } from "react-native"

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
      color: t.strong,
      fontSize: type.title.size,
      fontWeight: type.title.weight,
    },
    subheading: {
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
      color: t.strong,
      fontSize: type.label.size,
      fontWeight: "700",
    },
    body: {
      flex: 1,
      gap: 2,
    },
    name: {
      color: t.strong,
      fontSize: type.body.size,
      fontWeight: "600",
    },
    address: {
      color: t.text,
      fontSize: type.caption.size,
    },
  })
