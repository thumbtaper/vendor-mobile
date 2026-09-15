// Run with: npm test
//
// This module's entire job is to not lose a page, so the tests are the boundary
// cases: an exact multiple of the page size, one row past it, the ceiling, and a
// server that caps pages below what we asked for. Each of those, done wrong,
// loses rows silently — which is indistinguishable from the bug this replaces.

import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { fetchAllPages, type PageResult } from "./pagedFetch.ts"

/**
 * A fake server holding `total` rows, handing out at most `serverCap` per
 * request — which is how PostgREST's own max_rows behaves.
 */
function fakeServer(total: number, opts: { serverCap?: number; reportCount?: boolean } = {}) {
  const cap = opts.serverCap ?? Infinity
  const reportCount = opts.reportCount ?? true
  const windows: [number, number][] = []

  const all = Array.from({ length: total }, (_, i) => ({ id: i }))

  const fetchPage = async (from: number, to: number): Promise<PageResult<{ id: number }>> => {
    windows.push([from, to])
    const slice = all.slice(from, Math.min(to + 1, from + cap))
    return { rows: slice, total: reportCount ? total : null, error: null }
  }

  return { fetchPage, windows }
}

const ids = (rows: { id: number }[]) => rows.map(r => r.id)

describe("fetchAllPages — boundaries", () => {
  it("returns nothing, completely, for an empty set", async () => {
    const { fetchPage, windows } = fakeServer(0)
    const res = await fetchAllPages(fetchPage, { pageSize: 10 })
    assert.deepEqual(res.rows, [])
    assert.equal(res.complete, true)
    assert.equal(windows.length, 1)
  })

  it("stops after one request when the first page is short", async () => {
    const { fetchPage, windows } = fakeServer(4)
    const res = await fetchAllPages(fetchPage, { pageSize: 10 })
    assert.equal(res.rows.length, 4)
    assert.equal(res.complete, true)
    assert.equal(windows.length, 1, "a short page means the end — do not ask again")
  })

  it("handles an exact multiple of the page size without a wasted request", async () => {
    // 20 rows at pageSize 10: the count says we are done after the second page,
    // so a third request would be pointless. The naive loop asks anyway.
    const { fetchPage, windows } = fakeServer(20)
    const res = await fetchAllPages(fetchPage, { pageSize: 10 })
    assert.equal(res.rows.length, 20)
    assert.equal(res.complete, true)
    assert.equal(windows.length, 2)
    assert.deepEqual(ids(res.rows), Array.from({ length: 20 }, (_, i) => i))
  })

  it("fetches the one row that sits past a page boundary", async () => {
    // The classic off-by-one: 21 rows at pageSize 10 needs three requests, and
    // the last holds a single row.
    const { fetchPage, windows } = fakeServer(21)
    const res = await fetchAllPages(fetchPage, { pageSize: 10 })
    assert.equal(res.rows.length, 21)
    assert.equal(res.complete, true)
    assert.equal(windows.length, 3)
    assert.equal(res.rows[20].id, 20)
  })

  it("requests inclusive windows matching PostgREST .range()", async () => {
    const { fetchPage, windows } = fakeServer(25)
    await fetchAllPages(fetchPage, { pageSize: 10 })
    assert.deepEqual(windows, [[0, 9], [10, 19], [20, 29]])
  })

  it("loses no row and duplicates none across many pages", async () => {
    const { fetchPage } = fakeServer(1000)
    const res = await fetchAllPages(fetchPage, { pageSize: 7 })
    assert.equal(res.rows.length, 1000)
    assert.deepEqual(ids(res.rows), Array.from({ length: 1000 }, (_, i) => i))
    assert.equal(new Set(ids(res.rows)).size, 1000)
  })
})

describe("fetchAllPages — completeness", () => {
  it("reports incomplete when the ceiling is reached", async () => {
    const { fetchPage } = fakeServer(50)
    const res = await fetchAllPages(fetchPage, { pageSize: 10, maxRows: 30 })
    assert.equal(res.rows.length, 30)
    assert.equal(res.complete, false, "30 of 50 is a subset and must say so")
  })

  it("is complete when the ceiling is hit exactly and that is all there is", async () => {
    const { fetchPage } = fakeServer(30)
    const res = await fetchAllPages(fetchPage, { pageSize: 10, maxRows: 30 })
    assert.equal(res.rows.length, 30)
    assert.equal(res.complete, true)
  })

  it("reports incomplete when the SERVER caps pages below pageSize", async () => {
    // The trap. If max_rows were ever lowered below PAGE_SIZE, every page comes
    // back short while rows remain. Treating a short page as "reached the end"
    // would silently truncate — the exact bug this module exists to prevent.
    const { fetchPage } = fakeServer(500, { serverCap: 40 })
    const res = await fetchAllPages(fetchPage, { pageSize: 100 })
    assert.equal(res.rows.length, 40)
    assert.equal(res.complete, false, "a short page with rows outstanding is truncation, not the end")
  })

  it("reports the server's total so callers need not re-query it", async () => {
    const { fetchPage } = fakeServer(25)
    const res = await fetchAllPages(fetchPage, { pageSize: 10 })
    assert.equal(res.total, 25)
  })

  it("reports a null total when no count was requested", async () => {
    const { fetchPage } = fakeServer(15, { reportCount: false })
    const res = await fetchAllPages(fetchPage, { pageSize: 10 })
    assert.equal(res.total, null)
  })

  it("falls back to the short page when no count was requested", async () => {
    const { fetchPage } = fakeServer(15, { reportCount: false })
    const res = await fetchAllPages(fetchPage, { pageSize: 10 })
    assert.equal(res.rows.length, 15)
    assert.equal(res.complete, true)
  })

  it("cannot claim completeness at the ceiling with no count", async () => {
    const { fetchPage } = fakeServer(100, { reportCount: false })
    const res = await fetchAllPages(fetchPage, { pageSize: 10, maxRows: 30 })
    assert.equal(res.rows.length, 30)
    assert.equal(res.complete, false)
  })

  it("does not spin when the count grows mid-read", async () => {
    // Rows inserted while paging: the count keeps rising. The short-page stop is
    // an independent condition precisely so this terminates.
    let calls = 0
    const res = await fetchAllPages(async (from, to) => {
      calls++
      const rows = from < 20 ? Array.from({ length: to - from + 1 }, (_, i) => ({ id: from + i })) : []
      return { rows, total: 1000 + calls, error: null }
    }, { pageSize: 10, maxRows: 1000 })
    assert.equal(res.rows.length, 20)
    assert.equal(res.complete, false, "the count says there is more, so this is a subset")
    assert.ok(calls <= 4, `terminated in ${calls} calls`)
  })
})

describe("fetchAllPages — errors", () => {
  it("fails with no rows when the first page errors", async () => {
    const res = await fetchAllPages(async () => ({ rows: null, total: null, error: "boom" }))
    assert.deepEqual(res.rows, [])
    assert.equal(res.complete, false)
    assert.equal(res.error, "boom")
  })

  it("discards earlier pages when a later page errors", async () => {
    // A partial result handed back as though it were the answer is precisely the
    // failure mode being fixed, so an error must not return the rows it did get.
    let call = 0
    const res = await fetchAllPages(async (from, to) => {
      call++
      if (call === 3) return { rows: null, total: 100, error: "network" }
      return { rows: Array.from({ length: to - from + 1 }, (_, i) => ({ id: from + i })), total: 100, error: null }
    }, { pageSize: 10 })

    assert.deepEqual(res.rows, [], "no half-answers")
    assert.equal(res.complete, false)
    assert.equal(res.error, "network")
  })

  it("converts a THROWN fetch failure into a returned error", async () => {
    // supabase-js does not reliably turn a network-level failure into `{ error }`
    // — it can reject. A caller that trusted the contract then rendered an empty
    // list for a failed request, showing "no users" when the request had died.
    const res = await fetchAllPages(async () => { throw new Error("net::ERR_FAILED") })
    assert.deepEqual(res.rows, [])
    assert.equal(res.complete, false)
    assert.equal(res.error, "net::ERR_FAILED")
  })

  it("survives a non-Error throw", async () => {
    const res = await fetchAllPages(async () => { throw "boom" })
    assert.equal(res.error, "boom")
  })

  it("treats a null rows array as an empty page rather than throwing", async () => {
    const res = await fetchAllPages(async () => ({ rows: null, total: 0, error: null }), { pageSize: 10 })
    assert.deepEqual(res.rows, [])
    assert.equal(res.complete, true)
  })
})
