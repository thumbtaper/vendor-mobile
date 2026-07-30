// The branded auth surface: a hardcoded-dark navy palette with gold accents,
// copied from `vendor/components/auth/LoginPage/LoginPage.module.css` (which is
// itself explicitly a "full-screen hardcoded-dark branded surface" and ignores the
// web app's light/dark theme). `command` does the same on its own login.
//
// D3-A settled that mobile matches that behaviour: every pre-app route renders this
// palette regardless of the device theme, so the first thing a vendor sees is
// identical on web and mobile.
//
// This satisfies the same `Tokens` interface as `lightTokens`/`darkTokens` on
// purpose — `AuthScreen` swaps it in through `AppThemeContext`, so every child that
// already resolves colours via `useAppTheme()` (FormField, PrimaryButton,
// VendorPicker, the three auth forms, BlockedNotice) restyles with no edits of its
// own. Values are a copy, not an import: styles are never shared across repos, per
// `architecture/conventions.md`.

import { shadow, type Gradient, type Tokens } from "./tokens"

const GOLD = "#FFC200"
const GOLD_DEEP = "#e6a800"
/** `.primaryBtn`'s text colour — the darkest stop of the page gradient. */
const INK = "#04060e"

// `.primaryBtn`: `linear-gradient(135deg,#FFC200,#e6a800)`.
const BTN_GOLD: Gradient = {
  colors: [GOLD, GOLD_DEEP],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
}

// `.vendorAvatar` / `.logoBox` / `.formIconBox`: `linear-gradient(135deg,#1a3a8f,#2563eb)`.
const BRAND_BLUE: Gradient = {
  colors: ["#1a3a8f", "#2563eb"],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
}

// Status colours are product data, not chrome — a "pending" badge means the same
// thing on the auth surface as anywhere else, so these are re-stated rather than
// re-themed. Kept in step with `STATUS` in tokens.ts.
const STATUS: Tokens["status"] = {
  pending: { bg: "rgba(245,158,11,0.12)", fg: "#f59e0b" },
  confirmed: { bg: "rgba(16,185,129,0.12)", fg: "#10b981" },
  completed: { bg: "rgba(59,130,246,0.12)", fg: "#3b82f6" },
  cancelled: { bg: "rgba(239,68,68,0.1)", fg: "#ef4444" },
  refunded: { bg: "rgba(99,102,241,0.12)", fg: "#6366f1" },
}

export const brandTokens: Tokens = {
  // `.formTitle` is pure white; `.fieldLabel` is white at 45%.
  strong: "#ffffff",
  text: "rgba(255,255,255,0.45)",
  divider: "rgba(255,255,255,0.07)",

  // `.page`: `linear-gradient(145deg,#04060e 0%,#070b17 55%,#0d1b4b 100%)`. The
  // third stop is the navy that distinguishes this from the app's own dark page
  // background, which ends at near-black.
  pageBg: {
    colors: [INK, "#070b17", "#0d1b4b"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // No top bar or tab bar exists on a pre-app route. Present because `Tokens`
  // requires them; they are never read on this surface.
  topbarBg: "rgba(5,8,15,0.85)",
  tabbarBg: "rgba(5,8,15,0.8)",
  barBdr: "rgba(255,255,255,0.06)",

  // `.shell`: `rgba(255,255,255,0.025)` on `rgba(255,255,255,0.07)`.
  cardBg: "rgba(255,255,255,0.025)",
  cardBdr: "rgba(255,255,255,0.07)",
  cardShadow: shadow(
    {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 40 },
      shadowOpacity: 0.6,
      shadowRadius: 80,
    },
    12,
  ),
  cardBlur: 24, // `.shell`'s `backdrop-filter: blur(24px)`

  // `.vendorBtn` sits a touch lighter than the shell it lives in.
  pillBg: "rgba(255,255,255,0.04)",
  pillBdr: "rgba(255,255,255,0.08)",
  // `.input` / `.pwInput`.
  inputBg: "rgba(255,255,255,0.05)",
  inputBdr: "rgba(255,255,255,0.1)",
  inputColor: "#ffffff",
  subBg: "rgba(255,255,255,0.04)",

  overlaySubtle: "rgba(255,255,255,0.04)",
  overlayFaint: "rgba(255,255,255,0.06)",
  toggleOff: "rgba(255,255,255,0.1)",
  modalBg: "#0a0f1a",
  // `.badge`: gold at 10%, the only tinted block on the surface.
  heroBg: {
    colors: ["rgba(255,194,0,0.1)", "rgba(255,194,0,0.04)"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  editBtnBg: "rgba(255,255,255,0.05)",
  badgeBdr: "rgba(255,194,0,0.28)",
  panelBg: "#0c1220",
  panelBdr: "rgba(255,255,255,0.1)",
  panelShadow: shadow(
    {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.6,
      shadowRadius: 40,
    },
    12,
  ),

  // The substantive override: primary actions are gold here, not blue, so
  // `PrimaryButton` needs no variant prop.
  btnPrimary: BTN_GOLD,
  navActive: BRAND_BLUE,
  btnPrimaryShadow: shadow(
    {
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
    },
    6,
  ),
  accentUrgent: {
    colors: [GOLD, GOLD_DEEP],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  // Gold-on-white is unreadable — `.primaryBtn` uses the page's darkest ink.
  btnPrimaryFg: INK,
  // `.forgotLink`, `.signupLink`, `.brandSub`.
  accent: GOLD,

  status: STATUS,
}

/** `.shell`'s gold top edge and its 28px radius — not `radii.card`, which is 18. */
export const BRAND_SHELL = {
  radius: 28,
  topAccent: GOLD,
  topAccentWidth: 3,
} as const
