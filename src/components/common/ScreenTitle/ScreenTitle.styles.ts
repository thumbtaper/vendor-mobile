import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // Lifted verbatim from `ScreenShell.styles.ts` when B1 moved the title into
    // the scroll content. `paddingBottom` replaces the gap the old fixed header
    // provided between the title and the first piece of content below it.
    group: {
      gap: 2,
      paddingBottom: spacing.md,
    },
    title: {
      ...typeface.bold,
      color: t.strong,
      fontSize: type.title.size,
    },
    subtitle: {
      ...typeface.regular,
      color: t.text,
      fontSize: type.caption.size,
    },
  })
