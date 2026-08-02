// Design tokens ported from the vendor web app's `--sp-*` custom properties
// (`vendor/app/globals.css`, both `:root` and `.dark`). Values are copied verbatim
// so the two clients stay visually identical; when the web tokens change, change
// them here too — this is a copy, not an import (types and styles are never shared
// across repos, per `architecture/conventions.md`).
//
// Three web effects have no RN equivalent and are represented as data for the
// components that substitute them:
//   - gradients  -> arrays consumed by `expo-linear-gradient`
//   - blur       -> intensity consumed by `expo-blur`
//   - box-shadow -> per-platform shadow objects (see `shadow()` below)

import { Platform } from "react-native"

export interface Gradient {
  colors: [string, string, ...string[]]
  start: { x: number; y: number }
  end: { x: number; y: number }
}

export interface Shadow {
  shadowColor: string
  shadowOffset: { width: number; height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number
}

// `linear-gradient(145deg, …)` in CSS measures clockwise from "to top"; RN takes
// explicit start/end points. 145deg is close enough to a top-left → bottom-right
// sweep that the diagonal below reproduces it at phone aspect ratios.
const DIAGONAL = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } as const

// Android's `elevation` and iOS's `shadow*` are not interchangeable — elevation
// also affects z-ordering and draws a fixed system shadow. Callers get both and
// the platform ignores what it doesn't use.
export function shadow(
  ios: Omit<Shadow, "elevation">,
  androidElevation: number,
): Shadow {
  return Platform.select({
    ios: { ...ios, elevation: 0 },
    default: { ...ios, elevation: androidElevation },
  })
}

export interface Tokens {
  strong: string
  text: string
  divider: string

  pageBg: Gradient
  topbarBg: string
  tabbarBg: string
  barBdr: string

  cardBg: string
  cardBdr: string
  cardShadow: Shadow
  cardBlur: number // 0 = no blur; expo-blur `intensity`

  pillBg: string
  pillBdr: string
  inputBg: string
  inputBdr: string
  inputColor: string
  subBg: string

  overlaySubtle: string
  overlayFaint: string
  toggleOff: string
  modalBg: string
  heroBg: Gradient
  editBtnBg: string
  badgeBdr: string
  panelBg: string
  panelBdr: string
  panelShadow: Shadow

  // Not `--sp-*` variables on the web — these are the hard-coded gradients in
  // `.btn-primary` and `.nav-active`, identical in both themes.
  btnPrimary: Gradient
  navActive: Gradient
  btnPrimaryShadow: Shadow

  // The urgency bar on an `urgent` stat card — `vendor/components/ui/StatCard`'s
  // `bg-[linear-gradient(90deg,#f59e0b,#f97316)]`. Theme-independent.
  accentUrgent: Gradient

  // Foreground on top of `btnPrimary`. A token rather than a literal because the
  // branded auth surface (`brandTokens`) uses a gold button, where white text is
  // unreadable.
  btnPrimaryFg: string
  // Link and inline-action colour. Blue in both themes; gold on `brandTokens`.
  accent: string

  // Status colours from `vendor/lib/utils.ts` `statusStyle()`, theme-independent.
  status: Record<string, { bg: string; fg: string }>
}

const BTN_PRIMARY: Gradient = {
  colors: ["#2563eb", "#1d4ed8"],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
}

const NAV_ACTIVE: Gradient = {
  colors: ["#2563eb", "#1e40af"],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
}

// CSS `90deg` is a left-to-right sweep, so this one is horizontal — not the
// `DIAGONAL` used by the two 135deg button gradients above.
const ACCENT_URGENT: Gradient = {
  colors: ["#f59e0b", "#f97316"],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 },
}

const BTN_PRIMARY_SHADOW = shadow(
  {
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  6,
)

// statusStyle() in vendor/lib/utils.ts — same values, same statuses.
const STATUS: Tokens["status"] = {
  pending: { bg: "rgba(245,158,11,0.12)", fg: "#f59e0b" },
  confirmed: { bg: "rgba(16,185,129,0.12)", fg: "#10b981" },
  completed: { bg: "rgba(59,130,246,0.12)", fg: "#3b82f6" },
  cancelled: { bg: "rgba(239,68,68,0.1)", fg: "#ef4444" },
  refunded: { bg: "rgba(99,102,241,0.12)", fg: "#6366f1" },
}

export const lightTokens: Tokens = {
  strong: "#0f172a",
  text: "#64748b",
  divider: "rgba(0,0,0,0.07)",

  pageBg: { colors: ["#eef2ff", "#f0f4ff", "#f5f3ff"], ...DIAGONAL },
  topbarBg: "rgba(255,255,255,0.85)",
  tabbarBg: "rgba(248,250,252,0.9)",
  barBdr: "rgba(0,0,0,0.07)",

  cardBg: "#ffffff",
  cardBdr: "rgba(0,0,0,0.07)",
  cardShadow: shadow(
    {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    2,
  ),
  cardBlur: 0, // light theme is `--sp-card-blur: none`

  pillBg: "#f8fafc",
  pillBdr: "rgba(0,0,0,0.07)",
  inputBg: "#f8fafc",
  inputBdr: "rgba(0,0,0,0.1)",
  inputColor: "#0f172a",
  subBg: "#f8fafc",

  overlaySubtle: "rgba(0,0,0,0.04)",
  overlayFaint: "rgba(0,0,0,0.05)",
  toggleOff: "rgba(0,0,0,0.1)",
  modalBg: "#ffffff",
  heroBg: {
    colors: ["rgba(37,99,235,0.06)", "rgba(79,70,229,0.04)"],
    ...DIAGONAL,
  },
  editBtnBg: "rgba(37,99,235,0.06)",
  badgeBdr: "#f0f4ff",
  panelBg: "#ffffff",
  panelBdr: "rgba(0,0,0,0.1)",
  panelShadow: shadow(
    {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.14,
      shadowRadius: 40,
    },
    8,
  ),

  btnPrimary: BTN_PRIMARY,
  navActive: NAV_ACTIVE,
  btnPrimaryShadow: BTN_PRIMARY_SHADOW,
  accentUrgent: ACCENT_URGENT,
  btnPrimaryFg: "#ffffff",
  accent: "#2563eb",
  status: STATUS,
}

export const darkTokens: Tokens = {
  strong: "#f1f5f9",
  text: "#94a3b8",
  divider: "rgba(255,255,255,0.07)",

  pageBg: { colors: ["#04060e", "#070b17", "#05080f"], ...DIAGONAL },
  topbarBg: "rgba(5,8,15,0.85)",
  tabbarBg: "rgba(5,8,15,0.8)",
  barBdr: "rgba(255,255,255,0.06)",

  cardBg: "rgba(255,255,255,0.028)",
  cardBdr: "rgba(255,255,255,0.07)",
  cardShadow: shadow(
    {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 32,
    },
    4,
  ),
  cardBlur: 16, // `--sp-card-blur: blur(16px)`

  pillBg: "rgba(255,255,255,0.04)",
  pillBdr: "rgba(255,255,255,0.07)",
  inputBg: "rgba(255,255,255,0.05)",
  inputBdr: "rgba(255,255,255,0.1)",
  inputColor: "#e2e8f0",
  subBg: "rgba(255,255,255,0.04)",

  overlaySubtle: "rgba(255,255,255,0.04)",
  overlayFaint: "rgba(255,255,255,0.06)",
  toggleOff: "rgba(255,255,255,0.1)",
  modalBg: "#0a0f1a",
  heroBg: {
    colors: ["rgba(37,99,235,0.15)", "rgba(79,70,229,0.1)"],
    ...DIAGONAL,
  },
  editBtnBg: "rgba(255,255,255,0.05)",
  badgeBdr: "#05080f",
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

  btnPrimary: BTN_PRIMARY,
  navActive: NAV_ACTIVE,
  btnPrimaryShadow: BTN_PRIMARY_SHADOW,
  accentUrgent: ACCENT_URGENT,
  btnPrimaryFg: "#ffffff",
  accent: "#2563eb",
  status: STATUS,
}

// Radii and spacing lifted from the web component classes (`.sp-card` 18px,
// `.sp-pill`/`.sp-input` 12px, `.sp-panel` 16px).
export const radii = { pill: 999, sm: 8, md: 12, lg: 16, card: 18 } as const

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const

// Minimum interactive size — `ux-design` §5 and the plan's §5.3. The web's
// ~24pt approve/reject buttons are NOT ported at their web size.
export const MIN_TOUCH_TARGET = 44

// Type scale. `size` is the base value; RN scales it with the OS font setting by
// default, which is the behaviour we want (the web app's fixed `text-[11px]`
// values are deliberately not carried over). Caps go on individual <Text> via
// `maxFontSizeMultiplier` only where truncation would break meaning, or where a
// control is sized by padding rather than a `minHeight` floor — a floor absorbs
// scaled text for free, additive padding cannot, so an uncapped label there grows
// the control without limit. `BookingFilterTabs` is the one instance (capped at
// 1.3). Do not copy the cap onto controls that use a `minHeight` floor: they
// degrade correctly by growing with the text, which is the behaviour we want.
export const type = {
  caption: { size: 12, weight: "500" as const },
  body: { size: 15, weight: "400" as const },
  label: { size: 13, weight: "600" as const },
  title: { size: 20, weight: "700" as const },
  stat: { size: 28, weight: "700" as const },
} as const

export const fontFamily = "Inter_400Regular"
