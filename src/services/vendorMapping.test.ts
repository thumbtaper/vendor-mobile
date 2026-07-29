import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { toDbVendors, vendorInitials } from "./vendorMapping.ts"

const vendor = (name: string, status: string | null) => ({
  id: `id-${name}`,
  name,
  address: "1 Test St",
  statuses: status ? { name: status } : null,
})

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
