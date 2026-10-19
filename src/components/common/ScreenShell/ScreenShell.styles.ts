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
    // The only pinned chrome on a tab screen (B1). It carries the decorative
    // brand mark at left and interactive controls at right; the screen's name
    // still scrolls with its content in `ScreenTitle`.
    //
    // No `paddingBottom`: `ScreenTitle` carries the gap to the content below it,
    // so the space is owned by the thing that scrolls rather than split across the
    // seam between pinned and scrolling.
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
    brandMark: {
      width: 30,
      height: 30,
      borderRadius: 10,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    actionRowHidden: {
      height: 0,
      opacity: 0,
      overflow: "hidden",
      paddingTop: 0,
      transform: [{ translateY: -12 }],
    },
    body: {
      flex: 1,
    },
  })
