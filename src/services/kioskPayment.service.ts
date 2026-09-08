import * as WebBrowser from "expo-web-browser"

import { supabase } from "@/lib/supabase/client"

/**
 * Open the server-provided checkout URL without attaching the staff's credentials.
 * Android resolves on opening; iOS resolves on dismissal. Neither result is payment
 * confirmation. The checkout hook must refresh on foreground and on iOS dismissal.
 * Keep session creation separate so a browser-open retry reuses the same checkout URL.
 */
export async function openKioskPaymentBrowser(checkoutUrl: string): Promise<void> {
  const url = new URL(checkoutUrl)
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("The payment link is unavailable. Please see staff.")
  }
  await WebBrowser.openBrowserAsync(url.toString(), { dismissButtonStyle: "done" })
}

/** Read financial truth through the existing vendor RLS session; never infer it from navigation. */
export async function getKioskPaymentStatus(
  vendorId: string,
  bookingId: string,
): Promise<"paid" | "pending"> {
  const { data, error } = await supabase
    .from("bookings")
    .select("is_paid")
    .eq("id", bookingId)
    .eq("vendor_id", vendorId)
    .eq("booked_via", "kiosk")
    .single<{ is_paid: boolean }>()

  if (error || !data || typeof data.is_paid !== "boolean") {
    throw new Error("Payment status is unavailable. Please check again or see staff.")
  }
  return data.is_paid ? "paid" : "pending"
}
