import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    summarySection: {
      marginTop: spacing.lg,
    },
    note: {
      ...typeface.regular,
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
      paddingBottom: spacing.sm,
    },
  })
