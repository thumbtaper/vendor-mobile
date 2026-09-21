import assert from "node:assert/strict"
import { test } from "node:test"
import { classifyKioskSummaries, kioskVendorName, type KioskAccessRows } from "./kioskAccess.ts"

const vendorId = "10000000-0000-0000-0000-000000000003"
function allowed(): KioskAccessRows {
  return {
    profile: { statuses: { name: "active" } },
    portals: [{ portals: { name: "vendor" } }],
    membership: { vendor_id: vendorId, roles: { name: "vendor-admin" }, vendors: { id: vendorId, name: "Summit", statuses: { name: "active" } } },
  }
}
test("active profile, portal and pinned-vendor admin are all required", () => {
  assert.equal(kioskVendorName(allowed(), vendorId), "Summit")
  for (const change of [
    (r: KioskAccessRows) => { r.profile = null },
    (r: KioskAccessRows) => { r.profile!.statuses!.name = "suspended" },
    (r: KioskAccessRows) => { r.portals = [] },
    (r: KioskAccessRows) => { r.membership = null },
    (r: KioskAccessRows) => { r.membership!.roles!.name = "member" },
    (r: KioskAccessRows) => { r.membership!.vendor_id = "another-vendor" },
    (r: KioskAccessRows) => { r.membership!.vendors = null },
    (r: KioskAccessRows) => { r.membership!.vendors!.id = "another-vendor" },
    (r: KioskAccessRows) => { r.membership!.vendors!.statuses!.name = "suspended" },
  ]) {
    const rows = allowed()
    change(rows)
    assert.equal(kioskVendorName(rows, vendorId), null)
  }
})
test("launcher permits timed offerings, including 24-hour durations; excludes date granularity first", () => {
  const result = classifyKioskSummaries([
    { id: "24h", name: "24 hours", duration_unit: "hour" },
    { id: "minute", name: "Minutes", duration_unit: "minute" },
    { id: "day", name: "A day", duration_unit: "day" },
    { id: "week", name: "A week", duration_unit: "week" },
    { id: "month", name: "A month", duration_unit: "month" },
    { id: "missing", name: "No schedule", duration_unit: "hour" },
    { id: "unknown", name: "Unknown", duration_unit: "future-unit" },
  ], ["24h", "minute", "day", "unknown"])
  assert.deepEqual(result.filter(row => !row.reason).map(row => row.id), ["24h", "minute"])
  assert.equal(result.find(row => row.id === "week")?.reason, "Priced by the day, week or month")
  assert.equal(result.find(row => row.id === "missing")?.reason, "No active schedule")
  assert.equal(result.find(row => row.id === "unknown")?.reason, "Unsupported duration unit")
})
