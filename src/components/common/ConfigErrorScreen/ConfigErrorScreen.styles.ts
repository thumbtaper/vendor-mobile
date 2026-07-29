import { StyleSheet } from "react-native"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    safe: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    card: {
      gap: spacing.lg,
      alignItems: "center",
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
      borderWidth: 1,
      borderRadius: radii.card,
      padding: spacing.xl,
      ...t.cardShadow,
    },
    iconRing: {
      width: 64,
      height: 64,
      borderRadius: radii.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.pillBg,
      borderWidth: 1,
      borderColor: t.pillBdr,
    },
    title: {
      color: t.strong,
      fontSize: type.title.size,
      fontWeight: type.title.weight,
      textAlign: "center",
    },
    body: {
      color: t.text,
      fontSize: type.body.size,
      lineHeight: 21,
      textAlign: "center",
    },
    list: {
      alignSelf: "stretch",
      gap: spacing.sm,
    },
    // The variable names are the actionable part of this screen, so they get a
    // container that reads as data rather than prose.
    listItem: {
      backgroundColor: t.subBg,
      borderColor: t.pillBdr,
      borderWidth: 1,
      borderRadius: radii.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    listItemText: {
      color: t.strong,
      fontSize: type.label.size,
      fontWeight: type.label.weight,
    },
  })
