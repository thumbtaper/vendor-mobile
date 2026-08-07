import { StyleSheet } from "react-native"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // No horizontal inset of its own (B1). Every call site now renders this inside
    // an already-padded scroll container — the dashboard's `content`, or the
    // scrolling header of a `RefreshableList`. Adding 24 here as well would inset
    // it twice, and it cannot be bled back out with a wrapper because this
    // component renders `null` when the data is fresh: an empty wrapper would
    // still consume its parent's `gap`, leaving a permanent hole at the top of the
    // dashboard in the common case.
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
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
