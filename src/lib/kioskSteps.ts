import type { OfferingAttachment } from "./types.ts"

export type KioskStep = "offering" | "slot" | "customer" | "agreements" | "signature" | "payment" | "confirmation"

// Same document flags as vendor/lib/kioskSteps.ts. Photos never imply consent.
export function requirementsFor(attachments: OfferingAttachment[]) {
  const documents = attachments.filter(a => a.isActive && a.kind === "document")
  return {
    needsAgreement: documents.length > 0,
    needsSignature: documents.some(a => a.requiresSignature),
  }
}

export function stepsFor(attachments: OfferingAttachment[]): KioskStep[] {
  const { needsAgreement, needsSignature } = requirementsFor(attachments)
  return ["offering", "slot", "customer",
    ...(needsAgreement ? ["agreements" as const] : []),
    ...(needsSignature ? ["signature" as const] : []), "payment", "confirmation"]
}
