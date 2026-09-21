export interface KioskAccessRows {
  profile: { statuses: { name: string } | null } | null
  portals: { portals: { name: string } | null }[]
  membership: {
    vendor_id: string
    roles: { name: string } | null
    vendors: { id: string; name: string; statuses: { name: string } | null } | null
  } | null
}

export function kioskVendorName(rows: KioskAccessRows, vendorId: string): string | null {
  const member = rows.membership
  if (rows.profile?.statuses?.name !== "active" ||
      !rows.portals.some(row => row.portals?.name === "vendor") ||
      member?.vendor_id !== vendorId || member.roles?.name !== "vendor-admin" ||
      member.vendors?.id !== vendorId || member.vendors.statuses?.name !== "active") return null
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
