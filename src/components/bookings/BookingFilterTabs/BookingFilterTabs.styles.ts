import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

/**
 * Vertical padding on a chip. A literal 6 rather than a `spacing` token because it is
 * what puts the chip at vendor's exact button height — `py-[7px]` around a 16px line
 * box = 30px (`vendor/components/bookings/BookingsPage/BookingsPage.tsx:26-31`).
 * `spacing.sm` (8) overshoots it by 4pt, which is what made the strip still read as
 * oversized. Off-scale literals for small optical values are already used elsewhere in
 * this app (see `NotificationListItem.styles.ts`).
 */
const CHIP_PADDING_V = 6

/**
 * The chip is sized by padding to match vendor's filter row, which puts it below
 * `MIN_TOUCH_TARGET`. Extending the pressable area vertically keeps the *effective*
 * target at or above 44pt while the *visual* chip stays small — so `mobile-dev` §2's
 * 44pt rule is satisfied rather than waived (plan D1).
 *
 * Derived from `MIN_TOUCH_TARGET` and `CHIP_PADDING_V` rather than hardcoded, so
 * changing either the rule or the padding re-derives the slop instead of silently
 * leaving the chip short.
 *
 * `LABEL_LINE_BOX` is a deliberate UNDER-estimate of the rendered 12pt label. That
 * direction matters: under-estimating the height over-estimates the slop, so the real
 * target can only ever come out larger than 44 — never smaller.
 */
const LABEL_LINE_BOX = 14
const CHIP_HEIGHT = CHIP_PADDING_V * 2 + LABEL_LINE_BOX + 2 // padding + label + borders
const CHIP_SLOP = Math.max(0, Math.ceil((MIN_TOUCH_TARGET - CHIP_HEIGHT) / 2))

export const CHIP_HIT_SLOP = { top: CHIP_SLOP, bottom: CHIP_SLOP } as const

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    /**
     * The ScrollView's OWN style, not its content container — and the single
     * reason this strip was ever oversized.
     *
     * RN puts `flexGrow: 1` in the base style of every horizontal ScrollView
     * (`react-native/Libraries/Components/ScrollView/ScrollView.js:1887-1892`,
     * applied at `:1763`). In a column parent that makes the strip expand to fill
     * every remaining point of vertical space, and the content container then
     * stretches each chip to that full height. The chips were hundreds of points
     * tall for that reason alone — `minHeight` and `paddingVertical` never had any
     * say in it, which is why three separate attempts to tune them changed nothing.
     *
     * `flexGrow: 0` makes the strip size to its content. Do not remove it.
     */
    container: {
      flexGrow: 0,
    },
    scroll: {
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
      // Belt and braces against the stretch described above: `container` removes the
      // excess height, and this stops chips growing to the row's height if anything
      // ever gives the strip more than its content needs.
      alignItems: "center",
      // The list below already opens with its own top padding, so this only needs to
      // keep the chips off the content.
      paddingBottom: spacing.xs,
    },
    // Height comes from the padding, as it does on the web (`py-[7px]`). This only
    // takes effect now that `container.flexGrow` stops the stretch above; before
    // that, every value here was overridden by it.
    // The visual chip is under `MIN_TOUCH_TARGET`; `CHIP_HIT_SLOP` above restores
    // the real target. Do not reintroduce `minHeight` to "fix" the touch area —
    // that is what hitSlop is for, and it would undo the sizing.
    chip: {
      // Row, so the count badge sits beside the label rather than under it. The
      // active gradient is `position: "absolute"` and therefore out of flow, so
      // this affects only the label and the badge — it does not disturb the
      // sizing that CHIP_HEIGHT and the ScrollView's flexGrow:0 depend on.
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
    /**
     * The count badge. Sits inline with the label inside the chip, so the chip
     * grows with it rather than the badge floating over a corner — an overlaid
     * badge would clip against the chip's own border radius at this size.
     *
     * `maxFontSizeMultiplier` is capped at the call site for the same reason the
     * label is: this chip is sized by padding, not a minHeight floor.
     */
    badge: {
      marginLeft: 5,
      minWidth: 16,
      textAlign: "center",
      overflow: "hidden",
      borderRadius: radii.pill,
      paddingHorizontal: 5,
      fontSize: 10,
      lineHeight: 15,
      fontWeight: "800",
      color: "#ffffff",
      backgroundColor: "#ef4444",
    },
    // On the active chip the gradient already carries the emphasis, so the badge
    // steps back to a translucent wash rather than competing with it.
    badgeActive: {
      backgroundColor: "rgba(255,255,255,0.28)",
      color: "#ffffff",
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
