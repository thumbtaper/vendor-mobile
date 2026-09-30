import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
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
    pressed: {
      opacity: 0.75,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: radii.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    initials: {
        ...typeface.extraBold,
      fontSize: type.caption.size,
    },
    body: {
      flex: 1,
      gap: 3,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    name: {
        ...typeface.semibold,
      flexShrink: 1,
      color: t.strong,
      fontSize: type.body.size,
    },
    code: {
        ...typeface.extraBold,
      fontSize: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radii.pill,
      overflow: "hidden",
    },
    meta: {
        ...typeface.regular,
      color: t.text,
      fontSize: type.caption.size,
    },
    trailing: {
      alignItems: "flex-end",
      gap: spacing.xs,
    },
    badge: {
        ...typeface.bold,
      fontSize: type.caption.size,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: radii.pill,
      overflow: "hidden",
    },
    price: {
        ...typeface.regular,
      color: t.text,
      fontSize: type.caption.size,
    },
  })
