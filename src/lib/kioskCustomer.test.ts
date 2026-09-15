import assert from "node:assert/strict"
import { test } from "node:test"
import { allKioskDocumentsAgreed, normaliseKioskPhone, stripKioskPhone, validKioskCustomer, reviewExpired, KIOSK_REVIEW_MAX_MS, safeKioskReviewUrl } from "./kioskCustomer.ts"

const customer = { fullName: "Test Customer", email: "test@example.com", phone: "" }
test("customer requires name and valid email, but phone is optional", () => {
  assert.equal(validKioskCustomer(customer), true)
  assert.equal(validKioskCustomer({ ...customer, fullName: "  " }), false)
  for (const email of ["", "invalid", "a@b", "a b@example.com"]) {
    assert.equal(validKioskCustomer({ ...customer, email }), false)
  }
  assert.equal(validKioskCustomer({ ...customer, email: " test@example.com " }), true)
})
test("PH mobile accepts the same prefixes and separators as web", () => {
  for (const phone of ["0917 123 4567", "639171234567", "+63 (917) 123-4567", "0917.123.4567"]) {
    assert.equal(normaliseKioskPhone(phone), "+639171234567")
    assert.equal(validKioskCustomer({ ...customer, phone }), true)
  }
  for (const phone of ["123", "0917123456", "+14165551234", "02 8123 4567", "invalid"]) {
    assert.equal(validKioskCustomer({ ...customer, phone }), false)
  }
  assert.equal(stripKioskPhone("abc+63 (917)-123.4567"), "+63 (917)-123.4567")
})
test("every current document version must be agreed, independent of opening", () => {
  const documents = [{ id: "a", version: 1 }, { id: "b", version: 2 }]
  assert.equal(allKioskDocumentsAgreed(documents, new Set(["a:1"])), false)
  assert.equal(allKioskDocumentsAgreed(documents, new Set(["a:1", "b:1"])), false)
  assert.equal(allKioskDocumentsAgreed(documents, new Set(["a:1", "b:2"])), true)
  assert.equal(allKioskDocumentsAgreed([], new Set()), true)
})
test("review pause has the web ten-minute boundary", () => {
  assert.equal(reviewExpired(1000, 1000 + KIOSK_REVIEW_MAX_MS), false)
  assert.equal(reviewExpired(1000, 1001 + KIOSK_REVIEW_MAX_MS), true)
  assert.equal(reviewExpired(1000, 0), false)
})
test("review links require HTTPS and the exact allowed origin", () => {
  const origin = "https://example.supabase.co"
  assert.equal(safeKioskReviewUrl(`${origin}/storage/v1/object/sign/file`, origin), true)
  for (const url of ["javascript:alert(1)", "http://example.supabase.co/file", "https://example.supabase.co.attacker.test/file",
    "https://user:pass@example.supabase.co/file", "file:///tmp/file", "invalid"]) {
    assert.equal(safeKioskReviewUrl(url, origin), false)
  }
})
