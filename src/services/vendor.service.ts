// Adapted from `vendor/services/vendor.service.ts`. Same query, same
// `vendor-admin` role filter, same RLS boundary — this client has no extra
// privileges and asks for nothing the web app doesn't.
//
// Unlike the web version, `status` is NOT filtered here. The mobile gate needs to
// tell "pending activation" from "suspended" from "no vendor at all" so it can
// explain the difference (D5-A), and a service that pre-filters to active makes
// those three indistinguishable.

import { supabase } from "@/lib/supabase/client"
import { toDbVendors, type DbVendor } from "./vendorMapping"

// The mapping lives in `vendorMapping.ts` so it is testable without a Supabase
// client (I7). Re-exported here so callers keep importing from the service.
export type { DbVendor, VendorStatus } from "./vendorMapping"
export { vendorInitials } from "./vendorMapping"

export async function getUserVendors(): Promise<DbVendor[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("vendor_members")
    .select("roles(name), vendors(id, name, address, statuses(name))")
    .eq("user_id", user.id)

  if (error || !Array.isArray(data)) return []

  return toDbVendors(data as unknown[])
}
