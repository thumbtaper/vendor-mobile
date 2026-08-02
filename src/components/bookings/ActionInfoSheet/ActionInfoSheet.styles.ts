import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // Matches RejectReasonSheet exactly. Two sheets that differ by a few points
    // read as an inconsistency rather than as a distinction.
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
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
    // The `meaning` string. Given the strong colour rather than the muted one:
    // this is the sentence the vendor opened the sheet to read, not a caption.
    body: {
      color: t.text,
      fontSize: type.body.size,
      lineHeight: 21,
    },
  })

// The "i" control that opens the sheet.
//
// A circular 44pt target, sized by MIN_TOUCH_TARGET rather than by its glyph —
// an icon-sized hit area is the classic mobile accessibility failure, and this
// button sits next to a primary action where a mis-tap is expensive.
export const makeTriggerStyles = (t: Tokens) =>
  StyleSheet.create({
    trigger: {
      width: MIN_TOUCH_TARGET,
      height: MIN_TOUCH_TARGET,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: t.divider,
    },
    pressed: {
      opacity: 0.7,
    },
  })
