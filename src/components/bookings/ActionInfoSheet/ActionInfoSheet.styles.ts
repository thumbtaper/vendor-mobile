import { StyleSheet } from "react-native"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // Matches RejectReasonSheet exactly. Two sheets that differ by a few points
    // read as an inconsistency rather than as a distinction.
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    // The height bound, and it lives HERE rather than on `sheet` for a reason
    // specific to how RN resolves percentages: a percentage height resolves
    // against the parent's height, and a parent whose own height is auto gives it
    // nothing to resolve against. `backdrop` is `flex: 1` and therefore definite,
    // so this — its direct child — is the last place in the chain where "70%"
    // means anything. Put it on `sheet` instead and the sheet grows unbounded and
    // the ScrollView below never scrolls.
    //
    // Why bound it at all: this sheet now lists every action on screen, up to
    // three of them, each a label plus a two-line sentence. On a small phone at
    // the largest OS font setting that overflows, and the entry it would clip is
    // the last one — "Something's wrong", the action with the money consequence.
    sheetWrap: {
      maxHeight: "70%",
    },
    sheet: {
      flexShrink: 1,
      gap: spacing.lg,
      padding: spacing.xl,
      borderTopLeftRadius: radii.card,
      borderTopRightRadius: radii.card,
      backgroundColor: t.modalBg,
      borderTopWidth: 1,
      borderColor: t.panelBdr,
    },
    grabber: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: radii.pill,
      backgroundColor: t.toggleOff,
    },
    title: {
      color: t.strong,
      fontSize: type.title.size,
      fontWeight: type.title.weight,
    },
    // `flexShrink: 1` is what lets the list give up space to the grabber, title
    // and "Got it" button when `sheetWrap`'s bound bites. Without it the button
    // is the thing pushed off the bottom, leaving a sheet with no way out.
    scroll: {
      flexShrink: 1,
    },
    scrollContent: {
      gap: spacing.lg,
    },
    entry: {
      gap: spacing.xs,
    },
    // The action's name, styled to echo the button it explains without imitating
    // it — this is a glossary entry, not a second place to tap.
    entryLabel: {
      color: t.strong,
      fontSize: type.label.size,
      fontWeight: "700",
    },
    // The `meaning` string. Given the readable body size rather than a caption:
    // this is the sentence the vendor opened the sheet to read.
    body: {
      color: t.text,
      fontSize: type.body.size,
      lineHeight: 21,
    },
  })
