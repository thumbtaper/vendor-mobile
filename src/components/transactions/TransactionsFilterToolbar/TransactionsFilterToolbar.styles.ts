import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    toolbar: {
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radii.card,
      borderWidth: 1,
      borderColor: t.cardBdr,
      backgroundColor: t.cardBg,
      ...t.cardShadow,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    dateButton: {
      minWidth: 132,
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
    dateButtonPressed: {
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
    dateText: {
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
    value: {
        ...typeface.bold,
      color: t.strong,
      fontSize: type.label.size,
    },
    searchWrap: {
      flex: 1,
      minWidth: 0,
    },
  })
