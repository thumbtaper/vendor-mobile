import assert from "node:assert/strict"
import { test } from "node:test"
import { normaliseSignaturePng, signaturePath, signaturePoint } from "./kioskSignature.ts"
import { requirementsFor, stepsFor } from "./kioskSteps.ts"
import type { OfferingAttachment } from "./types.ts"

const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII="

test("native PNG normalisation accepts bare PNG and Android line breaks only", () => {
  assert.equal(normaliseSignaturePng(png), png)
  assert.equal(normaliseSignaturePng(png.slice(0, 40) + "\n" + png.slice(40) + "\n"), png)
  for (const invalid of ["", "data:image/png;base64," + png, "/9j/", "a".repeat(720001), png.slice(0, -1)]) {
    assert.equal(normaliseSignaturePng(invalid), null)
  }
})

test("PNG dimensions are bounded and require IHDR", () => {
  const bytes = Buffer.from(png, "base64")
  bytes.writeUInt32BE(4096, 16)
  assert.equal(normaliseSignaturePng(bytes.toString("base64")), null)
  bytes.writeUInt32BE(0, 16)
  assert.equal(normaliseSignaturePng(bytes.toString("base64")), null)
  bytes.writeUInt32BE(600, 16)
  bytes.write("nope", 12)
  assert.equal(normaliseSignaturePng(bytes.toString("base64")), null)
})

test("coordinates scale to fixed export dimensions and clamp to the drawing surface", () => {
  assert.deepEqual(signaturePoint(150, 75, 300, 150), { x: 300, y: 150 })
  assert.deepEqual(signaturePoint(-20, 999, 300, 150), { x: 0, y: 300 })
  assert.equal(signaturePoint(1, 1, 0, 150), null)
  assert.equal(signaturePoint(NaN, 1, 300, 150), null)
  assert.equal(signaturePath([]), "")
  assert.match(signaturePath([{ x: 5, y: 8 }]), /l0.01,0/)
})

test("no documents and agreement-only documents skip capture; multiple signed documents share one step", () => {
  const document = { id: "d1", kind: "document", isActive: true, requiresSignature: false } as OfferingAttachment
  assert.equal(stepsFor([]).includes("signature"), false)
  assert.equal(stepsFor([document]).includes("signature"), false)
  assert.equal(stepsFor([{ ...document, requiresSignature: true }, { ...document, id: "d2", requiresSignature: true }]).filter(s => s === "signature").length, 1)
  assert.equal(requirementsFor([{ ...document, kind: "photo", requiresSignature: true }]).needsSignature, false)
})
