// The app's period vocabulary: ONE preset table shared by the dashboard, the
// bookings list and the transactions ledger (dashboard range plan D3).
//
// Why a module rather than a hook: `windowFor` used to live inside
// `useTransactionsQuery.ts` with the 3- and 12-month arithmetic open-coded, so it
// could only be exercised by rendering a screen. Everything here is pure, which is
// what lets `node --test` reach it — the nested AGENTS.md rule that pure logic
// needing a test must live in its own module.
//
// ⚠️ Explicit `.ts` extensions and RELATIVE paths, not `@/`: the Node test runner
// resolves neither bare extensionless specifiers nor the TypeScript path alias.
// Metro resolves this form identically. Same constraint as `transactionTotals.ts`.
//
// ⚠️ Nothing here may import a service. `lib/` sits below `services/`, and a
// service import would drag `lib/supabase/client` into the test runner, which
// cannot load it.

import { fmtPhDate, phCurrentMonthRange, phToday } from "./format.ts"
import type { DateWindow } from "./types.ts"

export type PeriodPreset =
  | "today"
  | "last-7-days"
  | "this-month"
  | "last-3-months"
  | "last-12-months"

/**
 * The default on every screen that has a period.
 *
 * It is `this-month` because that is what the dashboard and the transactions
 * ledger already showed before either had a control — so introducing the strip
 * changes no screen's initial numbers.
 */
export const DEFAULT_PERIOD_PRESET: PeriodPreset = "this-month"

/**
 * Presets in strip order, shortest window first.
 *
 * A STRICT SUPERSET of the three the transactions screen shipped with
 * (`this-month`, `last-3-months`, `last-12-months`), which is why adopting this
 * table there is additive rather than a behaviour change (D3).
 *
 * ⚠️ Every window is BOUNDED, and no "all time" entry may be added. That refusal
 * is inherited verbatim from the original `WINDOW_PRESETS`: an unbounded window is
 * exactly what the truncation work exists to prevent, and the money queries behind
 * these presets cap at `TOTALS_MAX_ROWS`.
 */
export const PERIOD_PRESETS: readonly { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "last-7-days", label: "7 days" },
  { value: "this-month", label: "This month" },
  { value: "last-3-months", label: "3 months" },
  { value: "last-12-months", label: "12 months" },
]

/**
 * The window a preset selects, as of `today`.
 *
 * `today` defaults to the PH date and every production caller takes that default.
 * It is a parameter for two reasons, only one of which is testing: a strip that
 * resolves "today" once and computes every preset against it cannot mix two
 * calendar days when the resolution happens to straddle midnight.
 *
 * ⚠️ The 3- and 12-month arithmetic is preserved VERBATIM from the transactions
 * screen's original `windowFor`, including its month-overflow behaviour (see
 * `addMonths`). It is copied rather than corrected because changing it would
 * change what an existing screen returns, which D3 explicitly bought out of.
 */
export function windowFor(
  preset: PeriodPreset,
  today: string = phToday(),
): DateWindow {
  switch (preset) {
    case "today":
      return { from: today, to: today }
    // Seven calendar days INCLUDING today, hence −6. This differs in kind from the
    // month presets below, which count N months back from today and therefore
    // cover N months plus a day; those are inherited, this one is new and is
    // defined the way its label reads.
    case "last-7-days":
      return { from: addDays(today, -6), to: today }
    case "this-month":
      return phCurrentMonthRange(today)
    case "last-3-months":
      return { from: addMonths(today, -3), to: today }
    case "last-12-months":
      return { from: addMonths(today, -12), to: today }
  }
}

/** The default window itself — `windowFor(DEFAULT_PERIOD_PRESET)`. */
export function defaultWindow(today: string = phToday()): DateWindow {
  return windowFor(DEFAULT_PERIOD_PRESET, today)
}

/**
 * Which preset produces this window, or `null` if none does.
 *
 * Used to restore chip selection from a window carried in on route params, and to
 * decide whether a strip shows a selected chip at all. `null` is a legitimate
 * answer, not an error: it is what a custom range would return if one is ever
 * added, and the strip must render that state rather than falsely highlighting a
 * preset the window does not match.
 */
export function presetForWindow(
  window: DateWindow,
  today: string = phToday(),
): PeriodPreset | null {
  for (const { value } of PERIOD_PRESETS) {
    const candidate = windowFor(value, today)
    if (candidate.from === window.from && candidate.to === window.to) return value
  }
  return null
}

/**
 * Human label for a window — the stat cards' sub-line and the strip's caption.
 *
 * The whole-month case returns exactly what `DashboardStats.monthLabel` produced
 * before this module existed ("Aug 2026"), so the default period's cards read
 * unchanged.
 */
export function rangeLabel(
  window: DateWindow,
  today: string = phToday(),
): string {
  const { from, to } = window

  if (from === to) return from === today ? "Today" : fmtPhDate(from)

  const month = phCurrentMonthRange(from)
  if (month.from === from && month.to === to) return monthLabel(from)

  // Same year: the year is printed once, on the closing date — "15 May – 14 Aug
  // 2026". Matches `fmtBookingSpan`'s idiom rather than inventing a second range
  // format, and it matters on a 2×2 grid where the sub-line has ~128dp.
  if (from.slice(0, 4) === to.slice(0, 4)) {
    return `${dayMonth(from)} – ${fmtPhDate(to)}`
  }
  return `${fmtPhDate(from)} – ${fmtPhDate(to)}`
}

/**
 * The window as explicit DATES — for a section caption, where `rangeLabel`'s
 * compaction would be wrong.
 *
 * The two are deliberately different granularities, and both earn their place:
 * `rangeLabel` gives a stat card's sub-line the shortest true name for the period
 * ("Aug 2026", "Today"), while this always spells the span out ("01–31 Aug 2026").
 * A caption that repeated the card's own words would be noise directly above it;
 * what the caption adds is the exact span, and — at its call site — which CLOCK the
 * figures below are counted on.
 */
export function rangeDatesLabel(window: DateWindow): string {
  const { from, to } = window

  if (from === to) return fmtPhDate(from)

  // Same month: the month and year are printed once, at the end —
  // "01–31 Aug 2026". Tight enough for a caption line on a narrow phone.
  if (from.slice(0, 7) === to.slice(0, 7)) {
    return `${from.slice(8, 10)}–${fmtPhDate(to)}`
  }

  // Same year: the year is printed once. Matches `rangeLabel`'s spacing, which
  // uses a spaced en dash for cross-month spans and a tight one within a month.
  if (from.slice(0, 4) === to.slice(0, 4)) {
    return `${dayMonth(from)} – ${fmtPhDate(to)}`
  }
  return `${fmtPhDate(from)} – ${fmtPhDate(to)}`
}

/**
 * Whether a React Query key carries no window, or carries the DEFAULT one.
 *
 * This is the offline-persistence gate. `queryClient.ts` matches persisted queries
 * on `queryKey[0]` alone, so once a window joins the key EVERY period a vendor
 * browses would be written into one AsyncStorage blob — six booking filters times
 * five presets is thirty pages of cached rows. The offline promise is "a cold open
 * shows your normal view", not "every period you have ever looked at".
 *
 * Keys are recognised by shape: a window is the trailing PAIR of PH date strings.
 * Nothing else in any key is date-shaped — vendor ids are uuids and the bookings
 * key's status element is a comma-joined status list — so a key without that pair
 * is a key without a window, and those persist as they always did.
 */
export function isDefaultWindowKey(
  queryKey: readonly unknown[],
  today: string = phToday(),
): boolean {
  const from = queryKey[queryKey.length - 2]
  const to = queryKey[queryKey.length - 1]
  if (!isPhDate(from) || !isPhDate(to)) return true

  const fallback = defaultWindow(today)
  return from === fallback.from && to === fallback.to
}

/**
 * A window from route params, or `null` when the params do not describe one.
 *
 * VALIDATED, not cast. These arrive from `useLocalSearchParams`, which means they
 * can also arrive from a deep link — i.e. from outside the app — so "2026-02-30",
 * a reversed range, a repeated `?from=` (which expo-router surfaces as an array)
 * and a missing half all have to resolve to `null` and let the caller fall back to
 * the default, rather than reaching a query as a malformed bound.
 *
 * There is deliberately no `serialiseWindow` counterpart: a window is already two
 * strings, and an identity function would be ceremony.
 */
export function parseWindowParam(from: unknown, to: unknown): DateWindow | null {
  if (!isPhDate(from) || !isPhDate(to)) return null
  if (!isRealDate(from) || !isRealDate(to)) return null
  if (from > to) return null
  return { from, to }
}

const PH_DATE = /^\d{4}-\d{2}-\d{2}$/

function isPhDate(value: unknown): value is string {
  return typeof value === "string" && PH_DATE.test(value)
}

// Shape alone is not enough: "2026-02-30" and "2026-13-01" both match the pattern.
// Round-tripping through Date catches them, because an overflowing day normalises
// to a different one than was written.
//
// ⚠️ The NaN guard is load-bearing, not defensive padding. A day-overflow like
// "2026-02-30" parses to a real Date (2 March) and round-trips to a mismatch, but a
// MONTH-overflow like "2026-13-01" parses to Invalid Date, whose `toISOString()`
// THROWS. Since these values can arrive from a deep link, dropping this guard turns
// a rejected param into a crash on a screen with no error boundary. Caught by
// `dateWindows.test.ts` before this module had a caller.
function isRealDate(day: string): boolean {
  const parsed = new Date(`${day}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && toIsoDay(parsed) === day
}

function addDays(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return toIsoDay(d)
}

// ⚠️ Inherits JavaScript's month-overflow behaviour, on purpose and by copy: from
// the 31st of a month, stepping back into a shorter month overflows forward — 31
// May minus 3 months is 3 March, not 28 February. This is what the transactions
// screen has always done, and `dateWindows.test.ts` pins it so it stays a known
// quirk rather than a surprise. It only ever widens the window by a day or three,
// never narrows it, so no money goes missing because of it.
function addMonths(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + delta)
  return toIsoDay(d)
}

function toIsoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Both formatters go through Asia/Manila for the same reason `toPhDate` does: the
// device timezone is wherever the vendor is standing, and a PH-facing platform
// must not rename a day because someone opened the app in another country.
function monthLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "Asia/Manila",
    month: "short",
    year: "numeric",
  })
}

function dayMonth(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "Asia/Manila",
    day: "2-digit",
    month: "short",
  })
}
