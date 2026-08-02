// Copied and adapted from `vendor/lib/types.ts`. Types are never imported across
// repos (`architecture/conventions.md`) — this is a deliberate copy, and it must be
// updated alongside the web app's version after any schema change (this repo
// hand-writes its interfaces; there is no `supabase gen types`).
//
// Scope: only the entities this companion app actually renders. Staff, Schedule,
// Offering, VendorProfile, Requirement and the commented-out Package/Branch/
// Certificate types are omitted because those surfaces stay on the web portal
// (plan §1). Add them only if a screen needs them.

// All nine states the database allows (20260801000002). The four in the middle
// were added by the dual-acknowledgement work: a booking is only `completed` once
// BOTH the vendor and the booker have confirmed it, or the 3-day timer confirms
// for them. A vendor can no longer write `completed` directly.
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "fulfilled" // session: vendor performed it, waiting on the booker
  | "in_progress" // custody: handed over, with the customer
  | "returned" // custody: booker says it is back, waiting on the vendor
  | "completed"
  | "disputed" // flagged by either party; only Command can resolve it
  | "cancelled"
  | "refunded"

// Which shape a booking's fulfilment takes. Snapshotted onto the booking at
// creation, so editing an offering never strands a booking already in flight.
export type FulfilmentPattern = "session" | "custody"

// The payout lifecycle on `booking_transactions` (20260801000003). This — NOT the
// booking status — decides whether a vendor is owed money.
//
// ⚠️ `reversed` means the vendor's payout was cancelled. It says nothing about
// whether the BOOKER was refunded: this system has no refund mechanism at all.
// The DB column comment is explicit that it must never be labelled "Refunded".
export type PayoutStatus = "held" | "releasable" | "released" | "reversed"

export interface Booking {
  id: string
  bookerId: string
  bookerName: string
  bookerEmail: string
  bookerPhone: string
  offeringName: string
  offeringCode: string
  bookedDate: string
  startTime: string
  status: BookingStatus
  pricePaid: number
  notes: string
  rejectionReason: string
  // Which action the vendor is offered from `confirmed` — "Hand over" (custody)
  // or "Mark as done" (session). Read from the BOOKING, never the offering: it is
  // snapshotted at creation so editing an offering cannot restate a booking that
  // is already in flight.
  fulfilmentPattern: FulfilmentPattern
  // A booking can run the whole fulfilment flow unpaid (abandoned PayMongo
  // checkout), in which case no ledger row will ever exist for it.
  isPaid: boolean
  // When the booking last changed state — drives the 3-day auto-confirm
  // countdown. Nullable: the column was added by 20260801000002 and backfilled,
  // so a row that predates it can still be null. Treat null as "no countdown"
  // rather than assuming a date.
  statusChangedAt: string | null
}

// A confirmed payment, from booking_transactions joined to its booking.
//
// The money fields are an immutable snapshot taken when payment was confirmed —
// changing the platform fee percentage in Command never alters an existing row.
// `status` is the booking's CURRENT status (joined live, not snapshotted), which
// is why it can read `refunded`/`cancelled` on a transaction that really happened.
export interface Transaction {
  id: string
  bookingId: string
  bookerId: string
  bookerName: string
  bookerEmail: string
  bookerPhone: string
  offeringName: string
  offeringCode: string
  bookedDate: string // the service date (context only — not what we filter by)
  // The booking's lifecycle state. Displayed as a pill — it is NOT what decides
  // whether the vendor is owed the money; `payoutStatus` is.
  status: BookingStatus
  payoutStatus: PayoutStatus
  amountPaid: number
  platformFeePercent: number
  platformFeeAmount: number
  payoutAmount: number
  transactionDate: string // ISO timestamptz — when payment was confirmed
}

// Only the types that can actually reach THIS app. `notifications.service.ts`
// fetches with `.eq("portal", "vendor")`, so booker-portal types never arrive —
// `booking_fulfilled` and `booking_started` (20260801000007) are deliberately
// absent, because an entry for a row that can never exist is dead code that
// implies otherwise.
//
// The last four were added by the fulfilment work (20260801000007). Do NOT treat
// this union as a closed set at runtime: the database can emit a type newer than
// an installed binary, and a shipped app cannot be recompiled by a migration —
// see the fallback in NotificationListItem.
export type NotificationType =
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled"
  | "new_booking"
  | "payment_confirmed"
  | "vendor_pending_approval"
  | "new_user_registration"
  | "booking_returned"
  | "booking_completed"
  | "booking_disputed"
  | "dispute_resolved"

export interface AppNotification {
  id: string
  user_id: string
  portal: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown>
  is_read: boolean
  is_archived: boolean
  created_at: string
}

export interface Vendor {
  id: string
  name: string
  location: string
  branches: number
  initials: string
}
