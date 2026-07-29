import { StyleSheet } from "react-native"

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
      fontSize: type.caption.size,
      fontWeight: "800",
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
      flexShrink: 1,
      color: t.strong,
      fontSize: type.body.size,
      fontWeight: "600",
    },
    code: {
      fontSize: 10,
      fontWeight: "800",
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radii.pill,
      overflow: "hidden",
    },
    meta: {
      color: t.text,
      fontSize: type.caption.size,
    },
    trailing: {
      alignItems: "flex-end",
      gap: spacing.xs,
    },
    badge: {
      fontSize: type.caption.size,
      fontWeight: "700",
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: radii.pill,
      overflow: "hidden",
    },
    price: {
      color: t.text,
      fontSize: type.caption.size,
    },
  })
