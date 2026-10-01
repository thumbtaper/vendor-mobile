import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  blockedReasonFor, isVendorUsable, kycStatusOf, toDbVendors, vendorInitials,
  type DbVendor, type KycStatus, type VendorStatus,
} from "./vendorMapping.ts"

const vendor = (name: string, status: string | null, kyc: string | null = "approved") => ({
  id: `id-${name}`,
  name,
  address: "1 Test St",
  statuses: status ? { name: status } : null,
  vendor_kyc: kyc ? { status: kyc } : null,
})

const db = (status: VendorStatus, kycStatus: KycStatus): DbVendor =>
  ({ id: `${status}-${kycStatus}`, name: "V", address: null, status, kycStatus })

describe("toDbVendors — the vendor access gate's input (I2)", () => {
  it("keeps vendor-admin memberships", () => {
    const rows = [{ roles: { name: "vendor-admin" }, vendors: vendor("Citywide", "active") }]
    assert.equal(toDbVendors(rows).length, 1)
  })

  it("drops plain members — staff are not administrators", () => {
    const rows = [{ roles: { name: "member" }, vendors: vendor("Citywide", "active") }]
    assert.deepEqual(toDbVendors(rows), [])
  })

  it("drops rows with a null role", () => {
    const rows = [{ roles: null, vendors: vendor("Citywide", "active") }]
    assert.deepEqual(toDbVendors(rows), [])
  })

  it("drops memberships whose vendor join came back null", () => {
    const rows = [{ roles: { name: "vendor-admin" }, vendors: null }]
    assert.deepEqual(toDbVendors(rows), [])
  })

  it("PRESERVES non-active statuses rather than filtering them", () => {
    // This is the deliberate divergence from the web service (D5-A): the gate
    // must tell pending_activation from suspended from no-vendor-at-all. If this
    // ever starts filtering, all three blocked states collapse into one.
    const rows = [
      { roles: { name: "vendor-admin" }, vendors: vendor("Pending Co", "pending_activation") },
      { roles: { name: "vendor-admin" }, vendors: vendor("Suspended Co", "suspended") },
    ]
    const result = toDbVendors(rows)
    assert.equal(result.length, 2)
    assert.deepEqual(
      result.map((v) => v.status).sort(),
      ["pending_activation", "suspended"],
    )
  })

  it("maps a missing status to an empty string rather than throwing", () => {
    const rows = [{ roles: { name: "vendor-admin" }, vendors: vendor("No Status", null) }]
    assert.equal(toDbVendors(rows)[0].status, "")
  })

  it("ignores malformed rows without crashing the sign-in path", () => {
    const rows = [null, undefined, 42, "nope", {}, { roles: { name: "vendor-admin" } }]
    assert.deepEqual(toDbVendors(rows as unknown[]), [])
  })
})

describe("vendorInitials", () => {
  it("takes the first letter of the first two words", () => {
    assert.equal(vendorInitials("Citywide Sports Center"), "CS")
  })

  it("handles a single word", () => {
    assert.equal(vendorInitials("Summit"), "S")
  })

  it("survives extra whitespace", () => {
    assert.equal(vendorInitials("  Harbor   Sports  "), "HS")
  })

  it("returns empty for an empty name rather than throwing", () => {
    assert.equal(vendorInitials(""), "")
  })
})

// ── M1 (plan .plans/2026-09-30-vendor-signup-before-kyc.md): active AND KYC approved ──

describe("toDbVendors — KYC status", () => {
  it("maps the embedded packet status, and no packet to null", () => {
    const rows = [
      { roles: { name: "vendor-admin" }, vendors: vendor("A", "active", "approved") },
      { roles: { name: "vendor-admin" }, vendors: vendor("B", "active", null) },
    ]
    assert.deepEqual(toDbVendors(rows).map((v) => v.kycStatus), ["approved", null])
  })
})

describe("kycStatusOf", () => {
  it("reads the 1:1 object shape, and tolerates an array", () => {
    assert.equal(kycStatusOf({ status: "submitted" }), "submitted")
    assert.equal(kycStatusOf([{ status: "approved" }]), "approved")
  })
  it("treats anything else as no packet", () => {
    for (const x of [null, undefined, [], {}, { status: "APPROVED" }, { status: 1 }]) {
      assert.equal(kycStatusOf(x), null, JSON.stringify(x))
    }
  })
})

describe("isVendorUsable", () => {
  it("only active + approved opens the app", () => {
    assert.equal(isVendorUsable(db("active", "approved")), true)
    for (const k of [null, "submitted", "rejected"] as const) assert.equal(isVendorUsable(db("active", k)), false, String(k))
    for (const s of ["pending_activation", "suspended", ""] as const) assert.equal(isVendorUsable(db(s, "approved")), false, s)
  })
})

describe("blockedReasonFor", () => {
  it("no vendors → no_access", () => {
    assert.equal(blockedReasonFor([]), "no_access")
  })
  it("one vendor: each state gets its own reason", () => {
    assert.equal(blockedReasonFor([db("pending_activation", null)]), "verification_required")
    assert.equal(blockedReasonFor([db("active", null)]), "verification_required")
    assert.equal(blockedReasonFor([db("active", "rejected")]), "verification_required")
    assert.equal(blockedReasonFor([db("pending_activation", "submitted")]), "verification_in_review")
    assert.equal(blockedReasonFor([db("active", "submitted")]), "verification_in_review")
    assert.equal(blockedReasonFor([db("pending_activation", "approved")]), "pending_activation")
    assert.equal(blockedReasonFor([db("suspended", "approved")]), "suspended")
    assert.equal(blockedReasonFor([db("suspended", null)]), "suspended")
  })
  it("several vendors: the actionable reason wins, and pending still beats suspended", () => {
    assert.equal(blockedReasonFor([db("suspended", "approved"), db("pending_activation", null)]), "verification_required")
    assert.equal(blockedReasonFor([db("pending_activation", "approved"), db("active", "submitted")]), "verification_in_review")
    assert.equal(blockedReasonFor([db("suspended", "approved"), db("pending_activation", "approved")]), "pending_activation")
  })
})
