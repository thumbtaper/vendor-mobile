import * as WebBrowser from "expo-web-browser"
import { AppState } from "react-native"
import { SUPABASE_URL } from "@/lib/constants"
import { KIOSK_REVIEW_MAX_MS, safeKioskReviewUrl } from "@/lib/kioskCustomer"
import { supabase } from "@/lib/supabase/client"
import type { OfferingAttachment } from "@/lib/types"

export async function signKioskDocument(vendorId: string, offeringId: string, document: OfferingAttachment) {
  // Re-check the active row and vendor before signing. Never sign a path supplied
  // only by a stale catalogue selection.
  const { data: row, error } = await supabase.from("offering_attachments")
    .select("storage_path, version, offerings!inner(vendor_id, is_active)")
    .eq("id", document.id).eq("offering_id", offeringId).eq("kind", "document")
    .eq("is_active", true).eq("offerings.vendor_id", vendorId).eq("offerings.is_active", true).maybeSingle()
  if (error || !row?.storage_path || row.version !== document.version) throw new Error("Document unavailable")
  const signed = await supabase.storage.from("offering-attachments").createSignedUrl(row.storage_path, 300)
  const url = signed.data?.signedUrl
  if (signed.error || !url || !safeKioskReviewUrl(url, SUPABASE_URL)) throw new Error("Document unavailable")
  return { url, expiresAt: Date.now() + 300_000 }
}

/** Android resolves 'opened' immediately; wait for its background/foreground pair. */
export async function openKioskReviewBrowser(url: string): Promise<void> {
  if (!safeKioskReviewUrl(url, SUPABASE_URL) && !safeKioskReviewUrl(url, "https://ezzy.ph")) {
    throw new Error("This document cannot be opened.")
  }
  let away = false
  let finish: () => void = () => {}
  const returned = new Promise<void>(resolve => {
    finish = resolve
  })
  // Install before launching: foreground can arrive before openBrowserAsync settles.
  const subscription = AppState.addEventListener("change", state => {
    if (state !== "active") away = true
    else if (away) finish()
  })
  let timeout: ReturnType<typeof setTimeout> | undefined
  const expired = new Promise<void>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Review timed out. Please start again.")), KIOSK_REVIEW_MAX_MS + 1)
  })
  try {
    await Promise.race([
      (async () => {
        const result = await WebBrowser.openBrowserAsync(url, {
          dismissButtonStyle: "done", createTask: false, showInRecents: false,
        })
        if (result.type === "opened") await returned
      })(),
      // Also bounds an iOS modal that never dismisses.
      expired,
    ])
  } finally {
    subscription.remove()
    clearTimeout(timeout)
  }
}
