import assert from "node:assert/strict"
import { test } from "node:test"
import { KioskModeStore, kioskContainsStaff, KIOSK_STORAGE_KEY, areStaffNotificationsBlocked } from "./kioskMode.ts"

const vendorId = "10000000-0000-0000-0000-000000000003"
function storage(initial: string | null = null) {
  let value = initial
  return {
    getItem: async (key: string) => { assert.equal(key, KIOSK_STORAGE_KEY); return value },
    setItem: async (key: string, next: string) => { assert.equal(key, KIOSK_STORAGE_KEY); value = next },
    removeItem: async (key: string) => { assert.equal(key, KIOSK_STORAGE_KEY); value = null },
  }
}

test("restoration contains staff before reading storage", async () => {
  const store = new KioskModeStore(storage())
  assert.equal(kioskContainsStaff(store.getSnapshot()), true)
  await store.restore()
  assert.equal(kioskContainsStaff(store.getSnapshot()), false)
})
test("only the vendor UUID persists; restart returns to kiosk", async () => {
  const backing = storage()
  const store = new KioskModeStore(backing)
  await store.restore()
  await store.enter(vendorId)
  assert.equal(areStaffNotificationsBlocked(), true)
  const restarted = new KioskModeStore(backing)
  await restarted.restore()
  assert.deepEqual(restarted.getSnapshot(), { status: "active", vendorId })
  await restarted.leave()
  assert.equal(areStaffNotificationsBlocked(), false)
  await store.restore()
  assert.equal(store.getSnapshot().status, "inactive")
})
test("read errors and corrupt stored values fail closed", async () => {
  for (const backing of [storage("bad UUID"), { ...storage(), getItem: async () => { throw Error("disk") } }]) {
    const store = new KioskModeStore(backing)
    await store.restore()
    assert.equal(store.getSnapshot().status, "storage_error")
    assert.equal(kioskContainsStaff(store.getSnapshot()), true)
  }
})
test("failed entry writes do not expose staff; storage can be retried", async () => {
  const store = new KioskModeStore({ ...storage(), setItem: async () => { throw Error("disk") } })
  await store.restore()
  await assert.rejects(store.enter(vendorId))
  assert.equal(store.getSnapshot().status, "storage_error")
  await store.restore()
  assert.equal(store.getSnapshot().status, "inactive")
})
test("failed exit leaves the persisted kiosk and routes locked", async () => {
  const store = new KioskModeStore({ ...storage(vendorId), removeItem: async () => { throw Error("disk") } })
  await store.restore()
  await assert.rejects(store.leave())
  assert.deepEqual(store.getSnapshot(), { status: "active", vendorId })
})
test("invalid entry, re-entry and concurrent entry are rejected", async () => {
  let finish: (() => void) | undefined
  const store = new KioskModeStore({ ...storage(), setItem: () => new Promise<void>(resolve => { finish = resolve }) })
  await assert.rejects(store.enter(vendorId))
  await store.restore()
  await assert.rejects(store.enter("invalid"))
  const pending = store.enter(vendorId)
  await assert.rejects(store.enter(vendorId))
  finish?.()
  await pending
  await assert.rejects(store.enter(vendorId))
})
