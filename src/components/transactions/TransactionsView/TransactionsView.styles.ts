import { StyleSheet } from "react-native"

import { spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    note: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
      paddingBottom: spacing.sm,
    },
  })
