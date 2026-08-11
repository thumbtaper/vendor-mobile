import { StyleSheet } from "react-native"

import { spacing, type Tokens } from "@/theme/tokens"

export const makeStyles = (_t: Tokens) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    safe: {
      flex: 1,
    },
    // The only pinned chrome on a tab screen (B1). Right-aligned because it holds
    // actions, not identity — the screen's name now scrolls with its content, in
    // `ScreenTitle`.
    //
    // No `paddingBottom`: `ScreenTitle` carries the gap to the content below it,
    // so the space is owned by the thing that scrolls rather than split across the
    // seam between pinned and scrolling.
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
    body: {
      flex: 1,
    },
  })
