/*
 * Slot arithmetic — including the overnight cases the old `end_time` shape could
 * not express.
 *
 * ⚠️ These same cases must hold in `booker/lib/slots.test.ts`. The two `slots.ts`
 * files are byte-identical by policy (AGENTS.md forbids cross-app imports), and the
 * only thing keeping them so is this pair of suites plus a `diff` in review.
 */
import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { slotsInWindow, deriveSlots, spanFitsWindow, fitsInWindow, toMinutes, toHHMM } from "./slots.ts"

describe("toHHMM / toMinutes", () => {
  test("1440 renders as 24:00, not 00:00 — the end-of-day convention", () => {
    assert.equal(toHHMM(1440), "24:00")
    assert.equal(toMinutes("24:00"), 1440)
  })
})

describe("deriveSlots — the form that survives the refactor", () => {
  test("plain daytime window divides as before", () => {
    const r = deriveSlots("09:00", 180, 60)
    assert.deepEqual(r.starts, ["09:00", "10:00", "11:00"])
    assert.equal(r.remainderMinutes, 0)
    assert.equal(r.usableEnd, "12:00")
  })

  test("OVERNIGHT: 23:00 for 120 minutes yields 23:00 and 00:00", () => {
    const r = deriveSlots("23:00", 120, 60)
    assert.deepEqual(r.starts, ["23:00", "00:00"])
    assert.equal(r.usableEnd, "01:00")
  })

  test("OVERNIGHT: the plan's stated case — 23:00–01:00 with a 2-hour offering is one slot", () => {
    const r = deriveSlots("23:00", 120, 120)
    assert.deepEqual(r.starts, ["23:00"])
    assert.equal(r.usableEnd, "01:00")
  })

  test("a full day is 24 slots ending at 23:00, and closes at 24:00 not 00:00", () => {
    const r = deriveSlots("00:00", 1440, 60)
    assert.equal(r.starts.length, 24)
    assert.equal(r.starts[0], "00:00")
    assert.equal(r.starts[23], "23:00")
    assert.equal(r.usableEnd, "24:00")
  })

  test("a window ending exactly at midnight closes at 24:00", () => {
    assert.equal(deriveSlots("22:00", 120, 60).usableEnd, "24:00")
  })

  test("30-minute units cross midnight correctly", () => {
    assert.deepEqual(deriveSlots("23:00", 120, 30).starts, ["23:00", "23:30", "00:00", "00:30"])
  })

  test("a remainder is surfaced, not an error", () => {
    const r = deriveSlots("09:00", 150, 60)
    assert.deepEqual(r.starts, ["09:00", "10:00"])
    assert.equal(r.remainderMinutes, 30)
    assert.equal(r.usableEnd, "11:00")
  })

  test("a window shorter than one unit yields no slots but reports the remainder", () => {
    const r = deriveSlots("09:00", 30, 60)
    assert.deepEqual(r.starts, [])
    assert.equal(r.remainderMinutes, 30)
    assert.equal(r.usableEnd, null)
  })

  test("degenerate inputs are empty, never a throw", () => {
    for (const r of [deriveSlots("", 60, 60), deriveSlots("09:00", 0, 60), deriveSlots("09:00", 60, 0), deriveSlots("09:00", -60, 60)]) {
      assert.deepEqual(r.starts, [])
    }
  })
})

describe("slotsInWindow — the interim end_time caller, unchanged behaviour", () => {
  test("still divides a same-day window exactly as it always did", () => {
    const r = slotsInWindow("09:00", "12:00", 60)
    assert.deepEqual(r.starts, ["09:00", "10:00", "11:00"])
    assert.equal(r.usableEnd, "12:00")
  })

  test("00:00–24:00 still gives 24 slots", () => {
    assert.equal(slotsInWindow("00:00", "24:00", 60).starts.length, 24)
  })

  test("an inverted window is still empty — the old guard is preserved", () => {
    assert.deepEqual(slotsInWindow("23:00", "01:00", 60).starts, [])
  })
})

describe("fitsInWindow — multi-unit spans", () => {
  test("a 2-unit span from 23:00 fits a 120-minute window", () => {
    assert.equal(fitsInWindow("23:00", "23:00", 120, 60, 2), true)
  })

  test("a 3-unit span from 23:00 does NOT fit a 120-minute window", () => {
    assert.equal(fitsInWindow("23:00", "23:00", 120, 60, 3), false)
  })

  test("a span starting past midnight resolves against the window it belongs to", () => {
    assert.equal(fitsInWindow("00:00", "23:00", 120, 60, 1), true)
    assert.equal(fitsInWindow("00:00", "23:00", 120, 60, 2), false)
  })

  test("a start off the slot grid is refused", () => {
    assert.equal(fitsInWindow("23:30", "23:00", 120, 60, 1), false)
  })

  test("a start outside the window is refused, not wrapped into it", () => {
    // 08:00 against an 09:00 window wraps to offset 1380, far beyond the length.
    assert.equal(fitsInWindow("08:00", "09:00", 180, 60, 1), false)
  })

  test("agrees with spanFitsWindow on same-day windows", () => {
    for (const [start, q] of [["09:00", 1], ["10:00", 2], ["11:00", 2], ["08:00", 1]] as const) {
      assert.equal(
        fitsInWindow(start, "09:00", 180, 60, q),
        spanFitsWindow(start, "09:00", "12:00", 60, q),
        `${start} x${q}`,
      )
    }
  })
})
