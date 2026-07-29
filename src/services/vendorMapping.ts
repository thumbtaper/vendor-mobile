// Pure mapping extracted from `vendor.service.ts` so it can be unit-tested
// without a Supabase client (I7). The service keeps the I/O; this file keeps the
// branching that actually has rules in it.

export type VendorStatus = "active" | "suspended" | "pending_activation" | ""

export interface DbVendor {
  id: string
  name: string
  address: string | null
  status: VendorStatus
}

interface RawVendor {
  id: string
  name: string
  address: string | null
  statuses: { name: string } | null
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
          }
        : null,
    )
    .filter((v): v is DbVendor => Boolean(v))
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
