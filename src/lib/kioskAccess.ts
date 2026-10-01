import { isVendorUsable, kycStatusOf, type VendorStatus } from "../services/vendorMapping.ts"

export interface KioskAccessRows {
  profile: { statuses: { name: string } | null } | null
  portals: { portals: { name: string } | null }[]
  membership: {
    vendor_id: string
    roles: { name: string } | null
    // vendor_kyc: 1:1 embed — object or null (read through kycStatusOf).
    vendors: { id: string; name: string; statuses: { name: string } | null; vendor_kyc?: unknown } | null
  } | null
}

// The kiosk runs only for a vendor the app itself would open: active AND KYC approved
// (plan 2026-09-30-vendor-signup-before-kyc M1 — same rule as useVendorGate).
export function kioskVendorName(rows: KioskAccessRows, vendorId: string): string | null {
  const member = rows.membership
  if (rows.profile?.statuses?.name !== "active" ||
      !rows.portals.some(row => row.portals?.name === "vendor") ||
      member?.vendor_id !== vendorId || member.roles?.name !== "vendor-admin" ||
      member.vendors?.id !== vendorId ||
      !isVendorUsable({
        status: (member.vendors.statuses?.name ?? "") as VendorStatus,
        kycStatus: kycStatusOf(member.vendors.vendor_kyc),
      })) return null
  return member.vendors.name
}

export interface KioskOfferingSummary { id: string; name: string; duration_unit: string }
export function classifyKioskSummaries(offerings: KioskOfferingSummary[], scheduledIds: string[]) {
  const scheduled = new Set(scheduledIds)
  return offerings.map(offering => ({
    ...offering,
    reason: ["day", "week", "month"].includes(offering.duration_unit)
      ? "Priced by the day, week or month"
      : !["minute", "hour"].includes(offering.duration_unit)
        ? "Unsupported duration unit"
        : !scheduled.has(offering.id) ? "No active schedule" : null,
  }))
}
