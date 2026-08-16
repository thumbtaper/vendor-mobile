import { StyleSheet } from "react-native"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    card: {
      // `flexBasis: "47%"` rather than a fixed `minWidth`: the cards sit in a
      // wrapping row, and a 150px minimum wrapped them to one-per-row on any
      // device narrower than ~360dp (272dp of usable width leaves only 130dp
      // each), producing a tall single column instead of a 2×2 grid. 47% keeps two
      // per row from 320dp up; `flexGrow` still fills the leftover.
      flexGrow: 1,
      flexBasis: "47%",
      minWidth: 0,
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radii.card,
      borderWidth: 1,
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
      // Clips `accentBar` to the card's radius, as the web's `overflow-hidden` does.
      overflow: "hidden",
      ...t.cardShadow,
    },
    // Only reachable when the card was given an `onPress` (B3/D2). 0.75 matches
    // `BookingListItem`, the app's other pressable card — a press on a large
    // surface reads at a lower opacity than the 0.85 used for small buttons.
    pressed: {
      opacity: 0.75,
    },
    // 3px urgency bar pinned to the top edge. Longhand edges rather than
    // `StyleSheet.absoluteFillObject`, which RN 0.86 no longer exposes in its types.
    accentBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
    },
    // `marginBottom` on top of the card's 4px gap totals the web's `mb-3` (12px)
    // between the header and the value, while value→sub keeps the tighter 4px.
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    iconChip: {
      width: 30,
      height: 30,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      // Shares the header row with the 30dp chip, so it must be allowed to shrink
      // and wrap — at 320dp there is roughly 58dp left for it.
      flex: 1,
      color: t.text,
      fontSize: type.caption.size,
      fontWeight: "600",
    },
    value: {
      color: t.strong,
      fontSize: type.stat.size,
      fontWeight: type.stat.weight,
    },
    unavailable: {
      color: t.text,
      fontSize: type.title.size,
      fontWeight: type.title.weight,
    },
    sub: {
      color: t.text,
      fontSize: type.caption.size,
    },
    skeleton: {
      height: 28,
      borderRadius: radii.sm,
      backgroundColor: t.overlayFaint,
    },
    skeletonSub: {
      height: 12,
      width: "60%",
      borderRadius: radii.sm,
      backgroundColor: t.overlaySubtle,
    },
  })
