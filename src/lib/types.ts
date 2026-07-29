// Copied and adapted from `vendor/lib/types.ts`. Types are never imported across
// repos (`architecture/conventions.md`) — this is a deliberate copy, and it must be
// updated alongside the web app's version after any schema change (this repo
// hand-writes its interfaces; there is no `supabase gen types`).
//
// Scope: only the entities this companion app actually renders. Staff, Schedule,
// Offering, VendorProfile, Requirement and the commented-out Package/Branch/
// Certificate types are omitted because those surfaces stay on the web portal
// (plan §1). Add them only if a screen needs them.

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "refunded"

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
  status: BookingStatus
  amountPaid: number
  platformFeePercent: number
  platformFeeAmount: number
  payoutAmount: number
  transactionDate: string // ISO timestamptz — when payment was confirmed
}

export type NotificationType =
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled"
  | "new_booking"
  | "payment_confirmed"
  | "vendor_pending_approval"
  | "new_user_registration"

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
