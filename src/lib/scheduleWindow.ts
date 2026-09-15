/*
 * How an availability window reads to a human.
 *
 * A window is stored as a start plus a LENGTH (20260828000002), so its end is
 * derived — and for a window running past midnight that end is a SMALLER clock time
 * than the start. `23:00 – 01:00` on its own looks like a data-entry error, which is
 * exactly why the original `end_time > start_time` CHECK seemed reasonable for three
 * months. The `(+1)` is what stops it reading as a mistake, the way a transport
 * timetable marks a service arriving the next day.
 *
 * Own module because it is unit-tested, and separate from `slots.ts` because that
 * file is pure arithmetic kept byte-identical with the booker's copy; this is vendor
 * display, and the booker renders no schedule windows.
 */
import type { Schedule } from "./types.ts"
import { toMinutes, windowEnd } from "./slots.ts"

/** A full day. The maximum a window may be — `schedules_window_minutes_range`. */
export const FULL_DAY_MINUTES = 1440

/** Does this window finish on the day after it starts? */
export function crossesMidnight(start: string, windowMinutes: number): boolean {
  // Exactly 1440 from midnight ends at 24:00 — the end of its OWN day, not the next.
  // Anything landing strictly past that boundary belongs to tomorrow.
  return toMinutes(start) + windowMinutes > FULL_DAY_MINUTES
}

/**
 * "09:00 – 17:00", or "23:00 – 01:00 (+1)" when it finishes the next day.
 *
 * Returns the bare start when there is no length to render, so a half-filled form
 * shows something honest rather than "09:00 – ".
 */
export function formatWindow(start: string | null, windowMinutes: number | null): string {
  if (!start) return ""
  if (!windowMinutes) return start
  const end = windowEnd(start, windowMinutes)
  return crossesMidnight(start, windowMinutes) ? `${start} – ${end} (+1)` : `${start} – ${end}`
}

/** "2 hours", "45 minutes", "1 hour 30 minutes" — the length, said plainly. */
export function formatWindowLength(windowMinutes: number): string {
  const h = Math.floor(windowMinutes / 60)
  const m = windowMinutes % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h} hour${h === 1 ? "" : "s"}`)
  if (m > 0) parts.push(`${m} minute${m === 1 ? "" : "s"}`)
  return parts.join(" ") || "0 minutes"
}

/**
 * When a schedule runs, in one string, for either granularity.
 *
 * ⚠️ THE DATE-GRANULAR BRANCHES ARE LOAD-BEARING, not politeness. A date-granular
 * schedule has no `time` and no `windowMinutes`, and formatting it as a window
 * produced the literal text **"null - null"** on the Calendar page — shipped, and
 * invisible for months because the visual baseline had it baked in. `DayDetailPanel`
 * had already learned this lesson (its own comment records `null` rendering as an
 * empty gap); the Calendar page had not. Both now call this.
 */
export function formatScheduleWhen(s: Pick<Schedule, "time" | "windowMinutes" | "date" | "endDate">): string {
  if (s.time) return formatWindow(s.time, s.windowMinutes)
  if (s.endDate) return `${s.date} – ${s.endDate}`
  return `From ${s.date}`
}
