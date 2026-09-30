import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // No horizontal inset (B1) — rendered inside the list's scrolling header,
    // which already sits within the content container's `spacing.xl` padding.
    wrapper: {
      gap: spacing.sm,
      paddingBottom: spacing.md,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    note: {
      ...typeface.regular,
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
    warning: {
      ...typeface.regular,
      color: "#f59e0b",
      fontSize: type.caption.size,
      lineHeight: 18,
    },
  })
