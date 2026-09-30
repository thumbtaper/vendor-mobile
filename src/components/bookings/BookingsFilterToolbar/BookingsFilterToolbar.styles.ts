import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    toolbar: {
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radii.card,
      borderWidth: 1,
      borderColor: t.cardBdr,
      backgroundColor: t.cardBg,
      ...t.cardShadow,
    },
    button: {
      flex: 1,
      minHeight: MIN_TOUCH_TARGET + spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: t.pillBdr,
      backgroundColor: t.pillBg,
    },
    buttonPressed: {
      opacity: 0.75,
    },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: radii.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.editBtnBg,
      flexShrink: 0,
    },
    buttonText: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    eyebrow: {
        ...typeface.extraBold,
      color: t.text,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    valueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    value: {
        ...typeface.bold,
      flex: 1,
      color: t.strong,
      fontSize: type.label.size,
    },
    badge: {
        ...typeface.extraBold,
      minWidth: 18,
      overflow: "hidden",
      borderRadius: radii.pill,
      paddingHorizontal: 5,
      paddingVertical: 1,
      textAlign: "center",
      color: "#ffffff",
      backgroundColor: "#ef4444",
      fontSize: 10,
      flexShrink: 0,
    },
  })
