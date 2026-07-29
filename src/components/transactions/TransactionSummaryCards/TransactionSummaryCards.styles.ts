import { StyleSheet } from "react-native"

import { spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    wrapper: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    note: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
    warning: {
      color: "#f59e0b",
      fontSize: type.caption.size,
      lineHeight: 18,
    },
  })
