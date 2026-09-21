import assert from "node:assert/strict"
import { test } from "node:test"
import { requirementsFor, stepsFor } from "./kioskSteps.ts"
import type { OfferingAttachment } from "./types.ts"

const photo: OfferingAttachment = {
  id: "photo", offeringId: "offering", kind: "photo", title: "Court", storagePath: "photo.png",
  body: "", version: 1, requiresSignature: false, sortOrder: 0, isActive: true,
}

test("photos do not add an agreement or signature step", () => {
  assert.deepEqual(requirementsFor([photo]), { needsAgreement: false, needsSignature: false })
  assert.deepEqual(stepsFor([photo]), ["offering", "slot", "customer", "payment", "confirmation"])
})
test("active documents add agreement and optionally signature", () => {
  const document = { ...photo, kind: "document" as const }
  assert.deepEqual(requirementsFor([document]), { needsAgreement: true, needsSignature: false })
  assert.deepEqual(stepsFor([{ ...document, requiresSignature: true }]),
    ["offering", "slot", "customer", "agreements", "signature", "payment", "confirmation"])
  assert.deepEqual(requirementsFor([{ ...document, requiresSignature: true, isActive: false }]),
    { needsAgreement: false, needsSignature: false })
})
