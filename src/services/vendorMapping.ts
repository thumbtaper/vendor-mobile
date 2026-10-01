// Pure mapping extracted from `vendor.service.ts` so it can be unit-tested
// without a Supabase client (I7). The service keeps the I/O; this file keeps the
// branching that actually has rules in it.

export type VendorStatus = "active" | "suspended" | "pending_activation" | ""

/** The vendor's KYC packet status; null when none was submitted. */
export type KycStatus = "submitted" | "approved" | "rejected" | null

export interface DbVendor {
  id: string
  name: string
  address: string | null
  status: VendorStatus
  kycStatus: KycStatus
}

interface RawVendor {
  id: string
  name: string
  address: string | null
  statuses: { name: string } | null
  // 1:1 embed (vendor_kyc.vendor_id is its PK) — an object or null. See kycStatusOf.
  vendor_kyc?: unknown
}

interface MembershipRow {
  roles: { name: string } | null
  vendors: RawVendor | null
}

// Only `vendor-admin` memberships count. A plain `member` of a vendor is staff,
// not an administrator, and must not reach the app (I2).
//
// Status is mapped, never filtered here: the gate needs to tell
// pending_activation from suspended from no-vendor-at-all so it can explain the
// difference (D5-A). Filtering to active in this layer collapses all three.
export function toDbVendors(rows: unknown[]): DbVendor[] {
  return rows
    .filter(
      (r): r is MembershipRow =>
        typeof r === "object" && r !== null && "vendors" in r,
    )
    .filter((r) => r.roles?.name === "vendor-admin")
    .map((r) =>
      r.vendors
        ? {
            id: r.vendors.id,
            name: r.vendors.name,
            address: r.vendors.address,
            status: (r.vendors.statuses?.name ?? "") as VendorStatus,
            kycStatus: kycStatusOf(r.vendors.vendor_kyc),
          }
        : null,
    )
    .filter((v): v is DbVendor => Boolean(v))
}

/*
 * ── The dashboard rule (plan .plans/2026-09-30-vendor-signup-before-kyc.md, D1 / M1) ──
 *
 * Adapted from `vendor/lib/vendorGate.ts` (types and rules are copied across repos,
 * never imported). A vendor may use the app only when Command has ACTIVATED it AND
 * approved its KYC packet. Activation alone used to be enough.
 */

/**
 * The KYC status out of a PostgREST `vendor_kyc(status)` embed. 1:1, so an OBJECT or
 * null — an array is still accepted, because misreading the shape would read every
 * vendor as "no KYC" and block everyone.
 */
export function kycStatusOf(embedded: unknown): KycStatus {
  const row = Array.isArray(embedded) ? embedded[0] : embedded
  const status = (row as { status?: unknown } | null | undefined)?.status
  return status === "submitted" || status === "approved" || status === "rejected" ? status : null
}

export function isVendorUsable(v: Pick<DbVendor, "status" | "kycStatus">): boolean {
  return v.status === "active" && v.kycStatus === "approved"
}

/**
 * Why a signed-in admin with no usable vendor is blocked — each one gets its own copy
 * and next step (D5-A), and a reviewer's fresh account lands in one of them.
 *
 * - `verification_required` — no packet yet, or it was rejected: act on the web portal.
 * - `verification_in_review` — packet submitted, waiting on Command.
 * - `pending_activation` — packet approved; Command has not activated the vendor yet.
 * - `suspended` — the vendor is suspended.
 * - `no_access` — not a vendor-admin of anything.
 */
export type BlockedReason =
  | "verification_required"
  | "verification_in_review"
  | "pending_activation"
  | "suspended"
  | "no_access"

function reasonFor(v: DbVendor): Exclude<BlockedReason, "no_access"> {
  if (v.status === "suspended") return "suspended"
  if (v.kycStatus === null || v.kycStatus === "rejected") return "verification_required"
  if (v.kycStatus === "submitted") return "verification_in_review"
  return "pending_activation"   // approved, but not active yet
}

// For an admin of several vendors, none usable: the reason that asks the user to DO
// something wins, then the ones that are waiting, then suspension. This keeps the
// previous "pending over suspended" order and puts the new actionable state first.
const PRIORITY: Exclude<BlockedReason, "no_access">[] = [
  "verification_required", "verification_in_review", "pending_activation", "suspended",
]

/** Only meaningful when no vendor in `vendors` is usable. */
export function blockedReasonFor(vendors: DbVendor[]): BlockedReason {
  if (vendors.length === 0) return "no_access"
  const reasons = new Set(vendors.map(reasonFor))
  return PRIORITY.find(r => reasons.has(r)) ?? "no_access"
}

// Initials for the vendor avatar, matching how the web app renders them.
export function vendorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}
