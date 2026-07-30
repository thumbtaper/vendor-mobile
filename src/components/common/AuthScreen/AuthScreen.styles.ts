import { StyleSheet } from "react-native"

import { BRAND_SHELL } from "@/theme/brandTokens"
import { spacing, type, type Tokens } from "@/theme/tokens"

// `t` is always `brandTokens` here — `AuthScreen` overrides the theme context for
// its whole subtree — but the factory signature is kept so this file follows the
// same convention as every other `.styles.ts`.
export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    safe: {
      flex: 1,
    },
    keyboard: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: "center",
      padding: spacing.xl,
    },
    // `.shell` — 28px radius and a 3px gold top edge. Deliberately not `radii.card`
    // (18): this is the login shell, not a content card. No `overflow: "hidden"`,
    // both because nothing inside it overflows and because it would clip the shadow
    // on iOS (plan I10).
    shell: {
      borderRadius: BRAND_SHELL.radius,
      borderWidth: 1,
      borderColor: t.cardBdr,
      borderTopWidth: BRAND_SHELL.topAccentWidth,
      borderTopColor: BRAND_SHELL.topAccent,
      backgroundColor: t.cardBg,
      padding: spacing.xl,
      gap: spacing.lg,
      ...t.cardShadow,
    },
    // `.blob1` / `.blob2` — decorative radial washes. On the web they live inside
    // the marketing panel, which mobile does not have, so they sit on the page
    // itself, positioned partly off-screen as on the web.
    blob1: {
      position: "absolute",
      width: 380,
      height: 380,
      top: -100,
      left: -80,
    },
    blob2: {
      position: "absolute",
      width: 260,
      height: 260,
      bottom: -40,
      right: 0,
    },
    brand: {
      color: t.strong,
      fontSize: type.stat.size,
      fontWeight: type.stat.weight,
      letterSpacing: -0.5,
    },
    // `.brandSub` — gold, uppercase, tracked out.
    brandSub: {
      color: t.accent,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginTop: 2,
    },
    brandRow: {
      marginBottom: spacing.sm,
    },
  })
