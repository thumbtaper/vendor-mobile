// WHICH action a booking offers the vendor, as opposed to what it is CALLED —
// the wording lives in `bookingActionCopy.ts`.
//
// Extracted from the component hook rather than left inline (web keeps it inside
// `useBookingRow`) for one reason: this is the map between what the UI offers and
// what the database will accept. Offering the wrong move means a button that is
// guaranteed to fail against `validate_booking_status_transition`, and that is
// worth a test. Tests here run under `node --test`, which cannot load anything
// importing React or the Supabase client — hence its own module.

import type { Booking, BookingStatus } from "./types"
import type { BookingActionKey } from "./bookingActionCopy"

/** The four vendor-side fulfilment moves. Mirrors `FulfilAction` in the actions hook. */
export type FulfilActionName = "fulfil" | "start" | "confirm_return" | "undo"

export interface OfferedAction {
  action: FulfilActionName
  key: BookingActionKey
}

/**
 * The fulfilment move this booking offers, or null when there is none.
 *
 * `confirmed` yields DIFFERENT actions for the two patterns — that is the whole
 * reason the pattern is snapshotted onto the booking at creation.
 */
export function fulfilActionFor(
  b: Pick<Booking, "status" | "fulfilmentPattern">,
): OfferedAction | null {
  if (b.status === "confirmed" && b.fulfilmentPattern === "session") {
    return { action: "fulfil", key: "vendor_fulfil" }
  }
  if (b.status === "confirmed" && b.fulfilmentPattern === "custody") {
    return { action: "start", key: "vendor_start" }
  }
  if (b.status === "returned") {
    return { action: "confirm_return", key: "vendor_confirm_return" }
  }
  return null
}

// Undo is offered exactly where the VENDOR acted last and the customer has not
// yet responded. Never from `returned`: there the CUSTOMER acted, and rewinding
// it would erase someone else's input rather than the vendor's own.
const UNDOABLE: BookingStatus[] = ["fulfilled", "in_progress"]

export function canUndo(status: BookingStatus): boolean {
  return UNDOABLE.includes(status)
}

// A flag is only meaningful once fulfilment is under way. Before that the vendor
// can simply reject or cancel, which are cleaner exits than involving Ezzy.
//
// These four are exactly the `old.status` branches where
// `validate_booking_status_transition` (20260801000002:120-140) permits
// `-> disputed` for a vendor. Offering it anywhere else guarantees a rejected
// write. Note `completed` IS flaggable — a problem can surface after the fact,
// and flagging reverses the payout release.
const FLAGGABLE: BookingStatus[] = [
  "fulfilled",
  "in_progress",
  "returned",
  "completed",
]

export function canFlag(status: BookingStatus): boolean {
  return FLAGGABLE.includes(status)
}

/** The DB rejects a shorter reason (`raise_booking_dispute`), so the UI must too. */
export const MIN_DISPUTE_REASON = 10
