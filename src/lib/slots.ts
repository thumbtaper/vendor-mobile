/*
 * Slot arithmetic — the derived bookable units of an availability window.
 *
 * A schedule is a WINDOW, not a bookable thing. The units a booker can take are
 * derived by dividing that window by the offering's duration. Nothing stores
 * them (see the plan's D2), so this is the single definition of where they fall.
 *
 * ⚠️ This mirrors `check_booking_placement()` (20260803000005). If the rule
 * changes, both must change together: the trigger is what actually rejects a
 * booking, and this is what the vendor and the booker are shown. A preview that
 * disagrees with the trigger is worse than no preview — it invites a vendor to
 * publish slots the database will refuse.
 *
 * Deliberately duplicated in booker/lib/slots.ts. AGENTS.md forbids cross-app
 * imports; keep the two in step.
 */

/** Minutes from midnight for an "HH:MM" value. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/** "HH:MM" for minutes from midnight. 1440 renders as "24:00", not "00:00". */
export function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/**
 * Clock time for a SLOT START measured in minutes from the start of `windowStart`'s
 * day. Wraps: a window that opens 23:00 and runs 120 minutes has a slot at 1440,
 * which is midnight the NEXT day and reads "00:00", not "24:00".
 *
 * `% 1440` is total here because a window may not exceed 24 hours
 * (`schedules_window_minutes_range`) and a start is under 24:00, so the largest
 * value reachable is 2879.
 */
function slotClock(minutes: number): string {
  return toHHMM(minutes % 1440)
}

/**
 * Clock time for a WINDOW END, which is the one place "24:00" is the right answer.
 *
 * Deliberately NOT the same as `slotClock`: a window closing at 1440 closes at the
 * end of its own day and must read "24:00" — rendering it "00:00" would say the
 * window is empty. Past 1440 it wraps like any other next-day time.
 */
function windowEndClock(minutes: number): string {
  if (minutes <= 1440) return toHHMM(minutes)
  return toHHMM(minutes - 1440)
}

/**
 * Display end for a window expressed as start + length.
 *
 * Wraps past midnight, and keeps "24:00" for a window closing at end of day —
 * see `windowEndClock`. Exists so the services can present a familiar
 * "09:00 – 17:00" while `end_time` is no longer stored.
 */
export function windowEnd(windowStart: string, windowMinutes: number): string {
  if (!windowStart || windowMinutes <= 0) return ""
  return windowEndClock(toMinutes(windowStart) + windowMinutes)
}

/**
 * Window length for a start/end pair, or null when there is no time of day.
 *
 * Wraps: an end reading EARLIER than the start is the next day. Lives here rather
 * than in a service because two callers need the identical rule — the write path
 * and the form's conflict check — and a wrap rule duplicated is a wrap rule that
 * drifts.
 */
export function windowLength(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const span = toMinutes(end) - toMinutes(start)
  return span > 0 ? span : span + 1440
}

export interface SlotBreakdown {
  /** Start of each derived unit, "HH:MM", in order. */
  starts: string[]
  /** Minutes at the end of the window too short to hold another unit. */
  remainderMinutes: number
  /** Where the last usable unit ends — what to set End Time to for no remainder. */
  usableEnd: string | null
}

/**
 * Divide a window into whole units.
 *
 * A remainder is allowed, not an error: forcing an exact multiple would reject
 * 09:00–17:30 for a 1-hour offering, which is a legitimate thing to want. It is
 * surfaced instead, because silently swallowing 30 minutes of a vendor's
 * advertised availability is the confusing half of the old model.
 */
export function slotsInWindow(
  windowStart: string,
  windowEnd: string,
  durationMinutes: number,
): SlotBreakdown {
  const empty: SlotBreakdown = { starts: [], remainderMinutes: 0, usableEnd: null }
  if (!windowStart || !windowEnd || durationMinutes <= 0) return empty
  // A negative length reproduces the old inverted-window behaviour exactly:
  // `deriveSlots` returns empty, as this function used to on `span <= 0`.
  return deriveSlots(windowStart, toMinutes(windowEnd) - toMinutes(windowStart), durationMinutes)
}

/**
 * The same division, expressed as a window START plus a LENGTH.
 *
 * ⚠️ THIS IS THE ONE THAT SURVIVES. `slotsInWindow` above is the interim
 * `end_time`-shaped caller, kept working until the readers move over; this is
 * the form that can express a window running past midnight, because a length has
 * no midnight to cross. See the overnight plan, B1/B4.
 *
 * Slot starts are produced as clock times only at the very end — the division
 * itself is pure offsets, which is what makes it impossible to wrap.
 */
export function deriveSlots(
  windowStart: string,
  windowMinutes: number,
  durationMinutes: number,
): SlotBreakdown {
  const empty: SlotBreakdown = { starts: [], remainderMinutes: 0, usableEnd: null }
  if (!windowStart || windowMinutes <= 0 || durationMinutes <= 0) return empty

  const count = Math.floor(windowMinutes / durationMinutes)
  if (count === 0) return { starts: [], remainderMinutes: windowMinutes, usableEnd: null }

  const start = toMinutes(windowStart)
  const starts: string[] = []
  for (let i = 0; i < count; i++) starts.push(slotClock(start + i * durationMinutes))

  return {
    starts,
    remainderMinutes: windowMinutes - count * durationMinutes,
    usableEnd: windowEndClock(start + count * durationMinutes),
  }
}

/**
 * Whether `quantity` units starting at `startTime` fit inside the window.
 *
 * The booker's grid greys out start slots where they would not — checking only
 * the first slot is the likely wrong implementation, and the trigger would then
 * reject a selection the UI presented as available.
 */
export function spanFitsWindow(
  startTime: string,
  windowStart: string,
  windowEnd: string,
  durationMinutes: number,
  quantity: number,
): boolean {
  const start = toMinutes(startTime)
  const offset = start - toMinutes(windowStart)
  if (offset < 0 || offset % durationMinutes !== 0) return false
  return start + durationMinutes * quantity <= toMinutes(windowEnd)
}

/**
 * The same question against a window expressed as START + LENGTH.
 *
 * ⚠️ THIS IS THE ONE THAT SURVIVES — see `deriveSlots`.
 *
 * The wrap is in ONE place: a slot start that has passed midnight reads as a
 * SMALLER clock time than the window start, so its raw offset is negative and a
 * day is added back. That cannot produce a false positive — a genuinely
 * out-of-window start wraps to a large offset and is caught by the final
 * comparison against `windowMinutes`.
 */
export function fitsInWindow(
  startTime: string,
  windowStart: string,
  windowMinutes: number,
  durationMinutes: number,
  quantity: number,
): boolean {
  if (!startTime || !windowStart || windowMinutes <= 0 || durationMinutes <= 0) return false
  let offset = toMinutes(startTime) - toMinutes(windowStart)
  if (offset < 0) offset += 1440
  if (offset % durationMinutes !== 0) return false
  return offset + durationMinutes * quantity <= windowMinutes
}
