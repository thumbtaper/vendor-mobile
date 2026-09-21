/*
 * When does a schedule actually run?
 *
 * ⚠️ THIS RULE EXISTS IN FOUR PLACES. They must agree, and nothing but discipline
 * and the tests beside this file keeps them agreeing:
 *
 *   1. `check_booking_placement()`  — 20260803000005. THE AUTHORITY: it is what
 *      actually rejects a booking on a date the schedule does not run.
 *   2. `booker/services/schedules.service.ts` — `isOccurrence()`, decides which
 *      days the booker's calendar offers.
 *   3. this file — decides which days the vendor's calendar marks.
 *   4. `ezzy-vendor-mobile` — none today; if a calendar is ever added there, it
 *      becomes the fifth.
 *
 * Four copies is not a design choice. `AGENTS.md` forbids importing across app
 * boundaries, and (1) is plpgsql, so sharing one implementation is not available.
 * The mitigation is that `occurrence.test.ts` asserts the same fixture dates the
 * booker uses — a divergence should fail a test, not surface as a vendor marking
 * days the database will refuse to book.
 *
 *
 * ⚠️ OCCURRENCE vs BOOKED DATE — two different dates, and conflating them is the
 * trap this note exists to prevent (overnight plan, §3/B5):
 *
 *     The OCCURRENCE is the date the window OPENS — that is what this file decides.
 *     A booking's `booked_date` is the date the booking STARTS.
 *
 * For a same-day window they are equal, which is why the distinction never had to
 * be made before. For a Friday 23:00-01:00 window they are not: the 00:00 slot is
 * SATURDAY 00:00 and is stored with `booked_date = Saturday`, while the occurrence
 * it belongs to is FRIDAY. The DB derives the occurrence back from the booking —
 * see check_booking_placement (20260828000001).
 *
 * Booked date is the primitive because a booking must describe its own span with
 * no join (architecture/schema.md:639). Filing it under the occurrence date instead
 * would make `booked_date + start_time` resolve twenty-four hours early.
 *
 * Nothing below needs a branch for any of that: occurrence SELECTION is unchanged
 * by overnight windows — a Friday schedule still runs on Fridays and only Fridays.
 *
 * The previous implementation (`getSchedsForDay` in lib/utils.ts) got five things
 * wrong: no start_date bound, biweekly and monthly both treated as weekly, end_date
 * ignored, and date-granular schedules unhandled. See
 * .plans/2026-08-04-vendor-schedule-calendar-and-availability.md B2.
 */
import type { Schedule } from "./types"

/** "YYYY-MM-DD" → local midnight. Never `new Date(ymd)`, which parses as UTC. */
export function parseLocalDate(ymd: string): Date {
  return new Date(ymd + "T00:00:00")
}

/** DB day-of-week is 0=Mon..6=Sun; `Date.getDay()` is 0=Sun..6=Sat. */
function dbDowToJs(d: number): number {
  return (d + 1) % 7
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return d
}

/**
 * A schedule with no `time` is date-granular.
 *
 * `start_time` is NULL exactly when the offering is booked by whole days
 * (20260803000002), and `check_booking_placement()` enforces that invariant — so
 * this is a reliable discriminator without carrying `duration_unit` onto the
 * vendor's `Schedule` type just to ask.
 */
function isDateGranular(s: Schedule): boolean {
  return !s.time
}

/**
 * Does `schedule` run on `date`?
 *
 * `date` is compared at local-midnight precision; callers pass a `Date` built from
 * calendar cell values, which are already local midnight.
 */
export function isOccurrence(schedule: Schedule, date: Date): boolean {
  const startDate = parseLocalDate(schedule.date)
  if (date < startDate) return false
  if (schedule.endDate && date > parseLocalDate(schedule.endDate)) return false

  // Date-granular: recurrence and days-of-week do not apply — the availability IS
  // the date range, so every date inside it runs. Mirrors the date branch of
  // check_booking_placement().
  if (isDateGranular(schedule)) return true

  if (schedule.repeat === "none") {
    return (
      date.getFullYear() === startDate.getFullYear() &&
      date.getMonth() === startDate.getMonth() &&
      date.getDate() === startDate.getDate()
    )
  }

  const jsDows = schedule.days.map(dbDowToJs)
  if (!jsDows.includes(date.getDay())) return false

  if (schedule.repeat === "weekly") return true

  const refMonday = getMondayOfWeek(startDate)
  const dateMonday = getMondayOfWeek(date)
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksDiff = Math.round((dateMonday.getTime() - refMonday.getTime()) / msPerWeek)

  if (schedule.repeat === "biweekly") {
    return weeksDiff >= 0 && weeksDiff % 2 === 0
  }

  // monthly: the same week-of-month as start_date (e.g. always the 2nd Tuesday).
  return Math.ceil(date.getDate() / 7) === Math.ceil(startDate.getDate() / 7)
}
