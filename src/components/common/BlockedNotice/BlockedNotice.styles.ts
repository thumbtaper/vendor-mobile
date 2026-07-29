import { StyleSheet } from "react-native"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    wrapper: {
      gap: spacing.lg,
      alignItems: "center",
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
    actions: {
      alignSelf: "stretch",
      gap: spacing.md,
      marginTop: spacing.md,
    },
  })
