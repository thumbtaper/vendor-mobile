import { Platform, StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, type, type Tokens } from "@/theme/tokens"

// The visible mark is deliberately smaller than the hit area. See `mark` below.
const MARK_SIZE = 28

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // The HIT AREA — a full 44pt square, sized by MIN_TOUCH_TARGET rather than by
    // the glyph. An icon-sized target is the classic mobile accessibility failure,
    // and this control sits beside a primary action where a mis-tap is expensive.
    //
    // It draws NOTHING. The border and the 44pt box used to be the same element,
    // which made an outlined square the same height as the two action buttons —
    // so the row read as three buttons, one of which did nothing but talk (I1).
    trigger: {
      width: MIN_TOUCH_TARGET,
      height: MIN_TOUCH_TARGET,
      alignItems: "center",
      justifyContent: "center",
      // Pins the trigger to the end of the row even when it is the ONLY thing in
      // it. That case is real: a `completed` booking has no fulfil and no undo,
      // just a flag on its own row below — so this row holds the "i" alone, and
      // without the auto margin it would hang off the left edge. When the action
      // buttons ARE present they are `flex: 1` and eat the free space first, so
      // this contributes nothing and the trigger still lands right after them.
      marginLeft: "auto",
    },
    // The MARK — what the eye sees. Smaller than the target on purpose: the size a
    // thumb needs and the size a hint should look are different numbers, and only
    // the visual one is allowed to shrink.
    mark: {
      width: MARK_SIZE,
      height: MARK_SIZE,
      borderRadius: radii.pill,
      backgroundColor: t.overlaySubtle,
      alignItems: "center",
      justifyContent: "center",
    },
    // A serif italic reads unmistakably as an information mark at this size, where
    // a sans-serif "i" is easily mistaken for a stray character or a lowercase L.
    glyph: {
      color: t.text,
      fontSize: type.label.size,
      fontWeight: "700",
      fontStyle: "italic",
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    pressed: {
      opacity: 0.7,
    },
  })
