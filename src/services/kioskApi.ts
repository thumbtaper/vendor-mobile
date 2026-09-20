import { WEB_PORTAL_URL } from "@/lib/constants"
import { supabase } from "@/lib/supabase/client"

/** An API failure safe to display on the kiosk's customer-facing surface. */
export class KioskApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "KioskApiError"
  }
}

function kioskApiOrigin(): string {
  if (!WEB_PORTAL_URL) {
    throw new KioskApiError("Kiosk mode is not configured for this build.", 503)
  }

  try {
    const url = new URL(WEB_PORTAL_URL)
    if (url.protocol !== "https:") throw new Error("Kiosk API must use HTTPS.")
    return url.origin
  } catch {
    throw new KioskApiError("Kiosk mode is not configured for this build.", 503)
  }
}

async function kioskRequest<T>(path: string, body: unknown): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new KioskApiError("Staff sign-in is required before starting kiosk mode.", 401)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45_000)
  try {
  const response = await fetch(`${kioskApiOrigin()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  })

  const payload = await response.json().catch(() => ({})) as { error?: unknown }
  if (!response.ok) {
    const message = typeof payload.error === "string"
      ? payload.error
      : "The kiosk is temporarily unavailable. Please see staff."
    throw new KioskApiError(message, response.status)
  }

  return payload as T
  } finally { clearTimeout(timeout) }
}

export interface KioskBookingRequest {
  vendorId: string
  offeringId: string
  scheduleId: string
  occurrenceDate: string
  startTime: string
  quantity: number
  customer: {
    fullName: string
    email: string
    phone: string
  }
  legalVersion: string
  agreedAttachmentIds: string[]
  signatureBase64?: string
  signerName?: string
}

export interface KioskBookingResponse {
  bookingId: string
  bookedDate: string
  customerCreated: boolean
  free: boolean
}

export interface KioskCloseOutBooking {
  id: string
  offeringName: string
  stage: string
  status: string
  bookedDate?: string
  startTime?: string | null
}

export interface KioskCloseOutResponse {
  bookings: KioskCloseOutBooking[]
}

/** Creates a kiosk booking through the server-side, vendor-admin guarded route. */
export function createKioskBooking(request: KioskBookingRequest) {
  return kioskRequest<KioskBookingResponse>("/api/kiosk/booking", request)
}

/** Uses the existing web contract and its existing success/cancel destinations. */
export function createKioskPaymentSession(vendorId: string, bookingId: string) {
  return kioskRequest<{ checkout_url: string; session_id: string }>(
    "/api/kiosk/payment/create-session",
    { vendorId, bookingId },
  )
}

/** Finds only the kiosk bookings identified by the customer input. */
export function findKioskCloseOut(vendorId: string, identifier: string) {
  return kioskRequest<KioskCloseOutResponse>("/api/kiosk/close-out", { vendorId, identifier })
}

/** Confirms the server-derived close-out action for one kiosk booking. */
export function confirmKioskCloseOut(vendorId: string, bookingId: string) {
  return kioskRequest<{ status: "returned" | "completed" }>(
    "/api/kiosk/close-out/confirm",
    { vendorId, bookingId },
  )
}
