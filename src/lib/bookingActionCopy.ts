// Single source of truth for the fulfilment action wording shown to vendors.
//
// Copied from `vendor/lib/bookingActionCopy.ts` and kept WORD-FOR-WORD identical.
// Types and tables are copied across repos rather than imported — these are
// separate git repositories with no shared build tooling (root AGENTS.md), which
// the mobile-dev skill states explicitly. The cost of that is drift, so: **if you
// edit a label or a meaning here, mirror it in the vendor web app in the same
// change.** This is the copy that tells a vendor when they get paid; the two
// clients disagreeing about it is worse than either wording being imperfect.
//
// What is deliberately NOT here: which action applies to a given booking. That is
// decided from the booking's status + fulfilment pattern and lives in
// `bookingActionRules.ts` — separated so it can be unit-tested without React.
//
// The booker app's equivalent is `booker/lib/bookingActionCopy.ts` — different
// audience, different wording, deliberately not shared.

import type { FulfilmentPattern } from "./types"

export type BookingActionKey =
  | "vendor_approve"
  | "vendor_reject"
  | "vendor_start"
  | "vendor_fulfil"
  | "vendor_confirm_return"
  | "vendor_undo"
  | "vendor_dispute"

export interface BookingActionCopy {
  key: BookingActionKey
  /** Button text. Casual and short. */
  label: string
  /**
   * The body of the "i" bottom sheet. Always states the consequence for the
   * vendor's money — that is the question the sheet exists to answer.
   */
  meaning: string
  /** Which fulfilment shape this action belongs to. */
  pattern: FulfilmentPattern | "both"
  /**
   * Which part of a booking's life this action belongs to. Lets a surface list
   * the fulfilment glossary without the approval actions leaking into it — the
   * web dashboard's "Completing a Booking" guide item is exactly that case.
   */
  stage: "approval" | "fulfilment"
}

export const BOOKING_ACTIONS: readonly BookingActionCopy[] = [
  // Chronological: approval first, then the fulfilment moves. `stage` is what
  // callers filter on — do not rely on this ordering.
  {
    key: "vendor_approve",
    label: "Approve",
    meaning:
      "Confirms the booking and tells the customer. You have a few seconds to undo it — after that it can't be sent back to pending.",
    pattern: "both",
    stage: "approval",
  },
  {
    key: "vendor_reject",
    label: "Reject",
    meaning:
      "Asks you for a reason, then cancels the booking and tells the customer why. This can't be undone.",
    pattern: "both",
    stage: "approval",
  },
  {
    key: "vendor_start",
    label: "Hand over",
    meaning:
      "Starts the booking. The item or space is with the customer until they return it.",
    pattern: "custody",
    stage: "fulfilment",
  },
  {
    key: "vendor_fulfil",
    label: "Mark as done",
    meaning:
      "Tells the customer you've finished. They'll be asked to confirm — if they don't within 3 days, it confirms automatically.",
    pattern: "session",
    stage: "fulfilment",
  },
  {
    key: "vendor_confirm_return",
    label: "Got it back",
    meaning:
      "Confirms everything came back as expected. This is the last step — your payout becomes available once you tap it.",
    pattern: "custody",
    stage: "fulfilment",
  },
  {
    key: "vendor_undo",
    label: "Undo",
    meaning:
      "Puts this back a step. You can redo it anytime, but the customer's 3-day window starts over.",
    pattern: "both",
    stage: "fulfilment",
  },
  {
    key: "vendor_dispute",
    label: "Something's wrong",
    meaning:
      "Puts the booking on hold and asks Ezzy to step in. No payout is released until it's sorted.",
    pattern: "both",
    stage: "fulfilment",
  },
]

const BY_KEY = new Map(BOOKING_ACTIONS.map((a) => [a.key, a]))

/**
 * Look up one action's copy. Throws on an unknown key — the keys are a closed
 * union, so reaching this means the table and the type have drifted apart.
 */
export function actionCopy(key: BookingActionKey): BookingActionCopy {
  const copy = BY_KEY.get(key)
  if (!copy) throw new Error(`No booking action copy for "${key}"`)
  return copy
}
