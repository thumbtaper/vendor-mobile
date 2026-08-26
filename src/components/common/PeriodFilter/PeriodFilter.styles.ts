import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

// Legacy compact chip metrics. Bookings no longer stacks this strip under its
// status filter, but Dashboard and Transactions still use `PeriodFilter` until
// their call sites are intentionally redesigned.
const CHIP_PADDING_V = 6

// Same derivation as the bookings strip: the chip is sized by padding to match the
// web portal's control height, which lands it under MIN_TOUCH_TARGET, so the
// *effective* target is restored with hitSlop while the *visual* chip stays small.
// LABEL_LINE_BOX under-estimates the rendered 12pt label on purpose — that
// direction over-estimates the slop, so the real target can only come out larger
// than 44, never smaller.
const LABEL_LINE_BOX = 14
const CHIP_HEIGHT = CHIP_PADDING_V * 2 + LABEL_LINE_BOX + 2 // padding + label + borders
const CHIP_SLOP = Math.max(0, Math.ceil((MIN_TOUCH_TARGET - CHIP_HEIGHT) / 2))

export const CHIP_HIT_SLOP = { top: CHIP_SLOP, bottom: CHIP_SLOP } as const

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    /**
     * `flexGrow: 0` on the ScrollView's OWN style — not its content container.
     *
     * RN puts `flexGrow: 1` in the base style of every horizontal ScrollView
     * (`ScrollView.js:1887-1892`). In a column parent the strip then expands to
     * fill all remaining vertical space and stretches its chips to that height —
     * the bug that made the bookings strip render ~400pt tall, where `minHeight`
     * and `paddingVertical` had no say at all. Do not remove this.
     */
    container: {
      flexGrow: 0,
      // Bled back out of the surrounding 24pt inset so a chip can travel to the
      // screen edge: a horizontally scrolling strip that stops short of both edges
      // reads as clipped rather than scrollable. `scroll.paddingHorizontal` below
      // puts the 24 back at rest, so the appearance is unchanged.
      marginHorizontal: -spacing.xl,
    },
    scroll: {
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
      // Belt and braces against the stretch described above.
      alignItems: "center",
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: CHIP_PADDING_V,
      paddingHorizontal: spacing.md,
      borderRadius: radii.pill,
      borderWidth: 1,
      backgroundColor: t.pillBg,
      borderColor: t.pillBdr,
    },
    chipActive: {
      borderColor: "transparent",
    },
    label: {
      color: t.text,
      fontSize: type.caption.size,
      fontWeight: "600",
    },
    labelActive: {
      color: "#ffffff",
    },
    // Longhand: RN 0.86's types no longer expose `StyleSheet.absoluteFillObject`.
    gradient: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: radii.pill,
    },
  })
