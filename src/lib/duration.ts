/*
 * Offering duration — one normalised number, several renderings.
 *
 * `offerings.duration_minutes` is the single source of truth for all arithmetic.
 * `offerings.duration_unit` is the frame the vendor chose, and it does double
 * duty: it drives display AND it is the granularity discriminator, because
 * minutes alone cannot tell "1 day" from "24 hours" and only the vendor knows
 * which they meant.
 *
 * Deliberately duplicated in booker/lib/duration.ts rather than shared — the
 * apps are independent repos and AGENTS.md forbids cross-app imports. Keep the
 * two in step; the multipliers must match the DB comment on duration_minutes.
 */

export type DurationUnit = "minute" | "hour" | "day" | "week" | "month"

export const DURATION_UNITS: DurationUnit[] = ["minute", "hour", "day", "week", "month"]

/**
 * Minutes per unit. `month` is fixed at 30 days: a calendar month has no honest
 * minute count (28-31 days), so representing one in `duration_minutes` would be
 * a lie. 30 keeps every slot and overlap calculation exact and matches how
 * Postgres converts interval->epoch. The offering form states this to the vendor
 * at the point of entry.
 */
export const UNIT_MINUTES: Record<DurationUnit, number> = {
  minute: 1,
  hour: 60,
  day: 1440,
  week: 10080,
  month: 43200,
}

/**
 * Whether a booker picks whole dates rather than a time of day.
 *
 * This is the axis that decides which scheduling UI to show. It is NOT the same
 * as `fulfilmentPattern` (session/custody) — a 3-day training course is
 * session + date-granular, a 2-hour court booking is custody + time-granular.
 * All four combinations are real; do not collapse them.
 */
export function isDateGranular(unit: DurationUnit): boolean {
  return unit === "day" || unit === "week" || unit === "month"
}

/** How many whole units `minutes` represents, e.g. (120, "hour") -> 2. */
export function durationQty(minutes: number, unit: DurationUnit): number {
  return minutes / UNIT_MINUTES[unit]
}

/**
 * Human label for a duration, e.g. (120, "hour") -> "2 hours".
 *
 * A non-integer quantity (a duration edited out of step with its unit) falls
 * back to plain minutes rather than rendering "1.5 days", which would imply a
 * precision the scheduling model does not have.
 */
export function formatDuration(minutes: number, unit: DurationUnit): string {
  const qty = durationQty(minutes, unit)
  if (!Number.isInteger(qty)) return `${minutes} minutes`
  return `${qty} ${qty === 1 ? unit : `${unit}s`}`
}

/** The per-unit price suffix, e.g. "per hour". */
export function pricePerUnit(unit: DurationUnit): string {
  return `per ${unit}`
}
