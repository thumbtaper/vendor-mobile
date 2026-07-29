import { StyleSheet } from "react-native"

import { spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    safe: {
      flex: 1,
    },
    keyboard: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: "center",
      padding: spacing.xl,
      gap: spacing.lg,
    },
    brand: {
      color: t.strong,
      fontSize: type.stat.size,
      fontWeight: type.stat.weight,
      letterSpacing: -0.5,
    },
    brandRow: {
      marginBottom: spacing.sm,
    },
  })
