import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/constants"
import { kioskVendorName, type KioskAccessRows } from "@/lib/kioskAccess"
import { exclusionLabel } from "@/lib/kioskEligibility"
import { supabase } from "@/lib/supabase/client"
import { getKioskCatalogue } from "./kiosk.service"

export class KioskAccessError extends Error {
  constructor(readonly kind: "session" | "denied" | "connection" | "server", message: string) {
    super(message)
  }
}

function queryFailure(status: number): never {
  throw new KioskAccessError(status === 0 ? "connection" : "server",
    status === 0 ? "Cannot connect. Check the internet connection and retry." : "Kiosk is temporarily unavailable. Please retry.")
}

async function vendorAccess(client: SupabaseClient, userId: string, vendorId: string) {
  const profile = await client.from("profiles").select("statuses(name)").eq("id", userId).maybeSingle()
  if (profile.error) queryFailure(profile.status)
  const portals = await client.from("user_portals").select("portals!inner(name)")
    .eq("user_id", userId).eq("portals.name", "vendor").limit(1)
  if (portals.error) queryFailure(portals.status)
  const member = await client.from("vendor_members")
    .select("vendor_id, roles(name), vendors(id, name, statuses(name))")
    .eq("user_id", userId).eq("vendor_id", vendorId).maybeSingle()
  if (member.error) queryFailure(member.status)
  const name = kioskVendorName({ profile: profile.data, portals: portals.data ?? [], membership: member.data } as unknown as KioskAccessRows, vendorId)
  if (name === null) throw new KioskAccessError("denied", "Staff access to this kiosk needs attention.")
  return { vendorId, vendorName: name, userId }
}

export async function checkKioskAccess(vendorId: string) {
  const { data, error } = await supabase.auth.getUser()
  if (error && (error.name === "AuthRetryableFetchError" || !error.status || error.status >= 500)) queryFailure(error.status && error.status >= 500 ? error.status : 0)
  if (!data.user || error) throw new KioskAccessError("session", "Staff sign-in is required.")
  return vendorAccess(supabase, data.user.id, vendorId)
}

/** Verify privately first: wrong credentials/account must not replace the app session. */
export async function authenticateKioskStaff(vendorId: string, email: string, password: string, expectedUserId: string | null, assertCurrent: () => void) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
  assertCurrent()
  if (error || !data.user || !data.session) {
    throw new Error("Could not verify staff credentials. Check your details and connection.")
  }
  if (expectedUserId && data.user.id !== expectedUserId) throw new Error("Use the current staff account.")
  await vendorAccess(client, data.user.id, vendorId)
  assertCurrent()
  const result = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
  if (result.error) throw new Error("Staff sign-in could not be restored. Please retry.")
}

/** Launcher and customer catalogue use the same eligibility/read model. */
export async function getKioskLaunchSummary(vendorId: string) {
  const access = await checkKioskAccess(vendorId)
  const catalogue = await getKioskCatalogue(vendorId)
  return { ...access, offerings: [
    ...catalogue.eligible.map(offering => ({ ...offering, reason: null })),
    ...catalogue.excluded.map(({ offering, reason }) => ({ ...offering, reason: exclusionLabel(reason) })),
  ] }
}
