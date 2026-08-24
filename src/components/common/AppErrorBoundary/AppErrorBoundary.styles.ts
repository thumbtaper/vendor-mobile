import { StyleSheet } from "react-native"

import { radii, spacing, type, MIN_TOUCH_TARGET } from "@/theme/tokens"

// ⚠️ DELIBERATE DEVIATION from the app's `makeStyles(tokens)` convention — the
// only file in `components/` that does not take a `Tokens` argument.
//
// This component is rendered by expo-router's `Try` wrapper, which sits OUTSIDE
// the route component (`expo-router/build/useScreens.js:141-155` wraps
// `Try > component.default`). When it catches, `app/_layout.tsx` — and therefore
// `AppThemeProvider` — is NOT mounted. `useAppTheme()` throws without its
// provider (`theme/useAppTheme.ts:19`), so calling it here would throw *inside
// the error boundary while it renders the error*, which unmounts the whole tree
// and is strictly worse than having no boundary at all.
//
// The usual argument for `makeStyles` is that a module-level singleton freezes
// one theme's colours at import time. Here that is precisely what is wanted:
// there is no theme to read, so committing to one palette is the honest answer
// rather than a shortcut.
//
// The palette is `darkTokens` verbatim plus the splash background from
// `app.json` (`expo-splash-screen.backgroundColor`), so this screen reads as a
// continuation of the launch surface rather than as a foreign screen. Keep them
// in step if either changes.
const PAGE_BG = "#04060e" // app.json → expo-splash-screen.backgroundColor
const STRONG = "#f1f5f9" // darkTokens.strong
const TEXT = "#94a3b8" // darkTokens.text
const CARD_BG = "rgba(255,255,255,0.028)" // darkTokens.cardBg
const CARD_BDR = "rgba(255,255,255,0.07)" // darkTokens.cardBdr
const PILL_BG = "rgba(255,255,255,0.04)" // darkTokens.pillBg
const BTN_BG = "#2563eb" // the app's accent, as used for tabBarActiveTintColor

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  safe: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  card: {
    gap: spacing.lg,
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderColor: CARD_BDR,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.xl,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PILL_BG,
    borderWidth: 1,
    borderColor: CARD_BDR,
  },
  title: {
    color: STRONG,
    fontSize: type.title.size,
    fontWeight: type.title.weight,
    textAlign: "center",
  },
  body: {
    color: TEXT,
    fontSize: type.body.size,
    lineHeight: 21,
    textAlign: "center",
  },
  // Development only. The raw message is deliberately kept off the screen in a
  // release build — this app renders booker PII and payout figures, and an error
  // string can carry either. It still goes to the device log, so nothing is lost
  // for debugging (`useAppErrorBoundary.ts`).
  detail: {
    alignSelf: "stretch",
    backgroundColor: PILL_BG,
    borderColor: CARD_BDR,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  detailText: {
    color: STRONG,
    fontSize: type.caption.size,
    fontWeight: type.caption.weight,
  },
  button: {
    alignSelf: "stretch",
    minHeight: MIN_TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: BTN_BG,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: "#ffffff",
    fontSize: type.label.size,
    fontWeight: type.label.weight,
  },
})
