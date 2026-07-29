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
    header: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    titleGroup: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: t.strong,
      fontSize: type.title.size,
      fontWeight: type.title.weight,
    },
    subtitle: {
      color: t.text,
      fontSize: type.caption.size,
    },
    body: {
      flex: 1,
    },
  })
