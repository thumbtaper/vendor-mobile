import { StyleSheet } from "react-native"

import {
  MIN_TOUCH_TARGET,
  radii,
  spacing,
  type,
  type Tokens,
} from "@/theme/tokens"

const CHIP_SIZE = 34

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    card: {
      borderRadius: radii.card,
      borderWidth: 1,
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
      // `overflow: hidden` so the header's tint stops at the rounded corners —
      // without it the header paints square edges over the card's radius.
      overflow: "hidden",
      ...t.cardShadow,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
      padding: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.divider,
      backgroundColor: t.heroBg.colors[0],
    },
    headerText: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      // `flexShrink` so a long title wraps rather than squeezing the Hide button
      // below its 44pt floor — at large font settings that is a real collision.
      flexShrink: 1,
    },
    headerChip: {
      width: CHIP_SIZE,
      height: CHIP_SIZE,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.btnPrimary.colors[0],
      flexShrink: 0,
    },
    headerTitle: {
      color: t.strong,
      fontSize: type.label.size,
      fontWeight: "700",
    },
    headerSubtitle: {
      color: t.text,
      fontSize: type.caption.size,
      marginTop: 2,
    },
    // Hide is a real 44pt target. The web's equivalent is a ~24pt text button;
    // porting that size is the failure `tokens.ts` warns about.
    //
    // Its "Show" counterpart is gone with the row it lived in — revealing the
    // guide is the header button's job now, and two entry points was the
    // confusion that move set out to remove.
    toggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      minHeight: MIN_TOUCH_TARGET,
      paddingHorizontal: spacing.md,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: t.pillBdr,
      backgroundColor: t.pillBg,
      flexShrink: 0,
    },
    toggleLabel: {
      color: t.text,
      fontSize: type.caption.size,
      fontWeight: "600",
    },
    body: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    item: {
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: t.cardBdr,
      backgroundColor: t.subBg,
      // `borderLeftWidth` is set here, its COLOUR inline per item — the width is
      // the same for every row, the accent is not.
      borderLeftWidth: 3,
    },
    itemChip: {
      width: 30,
      height: 30,
      borderRadius: radii.sm,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      flexShrink: 0,
    },
    // `flex: 1` so the text column takes the space the chip leaves and wraps,
    // instead of overflowing the card at large font settings.
    itemText: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      color: t.strong,
      fontSize: type.label.size,
      fontWeight: "700",
    },
    itemBody: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
    // The action glossary. Same label-then-meaning shape as `ActionInfoSheet`,
    // deliberately: it is the same information, so it should not look like a
    // different kind of thing depending on where the vendor met it.
    actions: {
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    actionLabel: {
      color: t.strong,
      fontSize: type.caption.size,
      fontWeight: "700",
    },
    actionMeaning: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
    footnote: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
      paddingHorizontal: spacing.md,
    },
  })
