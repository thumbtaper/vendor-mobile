import type { Offering, Schedule } from "./types.ts"
import { isDateGranular } from "./duration.ts"

/*
 * Which of a vendor's offerings the kiosk may sell.
 *
 * Two exclusions, each for a reason recorded in the plan rather than invented here:
 *
 *   • DATE-GRANULAR offerings (priced per day/week/month) — D7. The booker's own
 *     date-granular arm is a documented dead end: the mode is detected and the range
 *     computed, but nothing renders it and `canNext` can never be satisfied. Building
 *     a second implementation of a mode the first app cannot finish would fork an
 *     unfinished behaviour.
 *   • Offerings with NO ACTIVE SCHEDULE — there is nothing to derive slots from, so
 *     the kiosk would show a card that leads to an empty picker.
 *
 * Custody offerings are NOT excluded (D2): 20260829000003/4 give them a completable
 * path, so a rental sells at the kiosk like anything else.
 *
 * Own module, and pure, because this is a correctness rule with a failure mode that is
 * invisible until a customer is stuck — and because `node --test` can reach it here.
 */

export type ExclusionReason = "date_granular" | "no_schedule"

export interface KioskOfferingSet {
  /** Sellable at the kiosk, in the order given. */
  eligible: Offering[]
  /** Everything active but not sellable, with why — B13's launcher names these. */
  excluded: { offering: Offering; reason: ExclusionReason }[]
}

/**
 * Split a vendor's active offerings into what the kiosk can and cannot sell.
 *
 * `schedules` should be the vendor's ACTIVE schedules; an offering with none is
 * excluded. Inactive offerings are expected to have been filtered out already — they
 * are not "excluded from the kiosk", they are simply not on sale anywhere.
 */
export function classifyKioskOfferings(
  offerings: Offering[],
  schedules: Schedule[],
): KioskOfferingSet {
  const scheduled = new Set(schedules.map(s => s.offeringId))

  const eligible: Offering[] = []
  const excluded: { offering: Offering; reason: ExclusionReason }[] = []

  for (const o of offerings) {
    // Order matters for the message a vendor reads: "priced per day" is the more
    // useful thing to be told, and it is also the one they cannot fix by adding a
    // schedule.
    if (isDateGranular(o.durationUnit)) {
      excluded.push({ offering: o, reason: "date_granular" })
    } else if (!scheduled.has(o.id)) {
      excluded.push({ offering: o, reason: "no_schedule" })
    } else {
      eligible.push(o)
    }
  }

  return { eligible, excluded }
}

/** Vendor-facing wording for the launcher (B13). Kept beside the rule it explains. */
export function exclusionLabel(reason: ExclusionReason): string {
  return reason === "date_granular"
    ? "priced by the day — the kiosk sells hourly offerings only"
    : "has no active schedule"
}
