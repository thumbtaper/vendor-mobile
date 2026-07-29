import { StyleSheet } from "react-native"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      borderWidth: 1,
      backgroundColor: "rgba(245,158,11,0.12)",
      borderColor: "rgba(245,158,11,0.35)",
    },
    text: {
      flex: 1,
      color: t.strong,
      fontSize: type.caption.size,
    },
  })
