export interface KioskCustomer { fullName: string; email: string; phone: string }

export function allKioskDocumentsAgreed(documents: { id: string; version: number }[], agreed: Set<string>): boolean {
  return documents.every(document => agreed.has(`${document.id}:${document.version}`))
}

// Matches vendor/lib/payout/phMobile.ts and kioskSteps.ts.
export function normaliseKioskPhone(value: string): string | null {
  const clean = value.replace(/[\s()\-.]/g, "")
  const match = /^(?:0|63|\+63)(9\d{9})$/.exec(clean)
  return match ? `+63${match[1]}` : null
}
export function stripKioskPhone(value: string): string {
  return value.replace(/[^\d+()\-. ]/g, "")
}
export function validKioskCustomer(customer: KioskCustomer): boolean {
  return Boolean(customer.fullName.trim()) && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email.trim()) &&
    (!customer.phone.trim() || normaliseKioskPhone(customer.phone) !== null)
}

export const KIOSK_REVIEW_MAX_MS = 600_000
export function reviewExpired(startedAt: number, now: number): boolean {
  return now - startedAt > KIOSK_REVIEW_MAX_MS
}

export function safeKioskReviewUrl(value: string, allowedOrigin: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.origin === new URL(allowedOrigin).origin && !url.username && !url.password
  } catch { return false }
}
