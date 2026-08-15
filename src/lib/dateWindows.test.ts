import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  DEFAULT_PERIOD_PRESET,
  PERIOD_PRESETS,
  defaultWindow,
  isDefaultWindowKey,
  parseWindowParam,
  presetForWindow,
  rangeLabel,
  windowFor,
} from "./dateWindows.ts"

// Every case pins an explicit reference day. Passing `today` is what makes this
// suite deterministic — without it these assertions would rot at the next month
// boundary, which is precisely the class of bug the module exists to get right.
const TODAY = "2026-08-14"

describe("windowFor — the preset table", () => {
  it("scopes 'today' to a single inclusive day", () => {
    assert.deepEqual(windowFor("today", TODAY), {
      from: "2026-08-14",
      to: "2026-08-14",
    })
  })

  it("counts seven days INCLUDING today, not eight", () => {
    const window = windowFor("last-7-days", TODAY)
    assert.deepEqual(window, { from: "2026-08-08", to: "2026-08-14" })
    assert.equal(inclusiveDays(window), 7)
  })

  it("gives 'this month' the whole calendar month, not month-to-date", () => {
    assert.deepEqual(windowFor("this-month", TODAY), {
      from: "2026-08-01",
      to: "2026-08-31",
    })
  })

  it("counts the month presets back from today, as the transactions screen always did", () => {
    assert.deepEqual(windowFor("last-3-months", TODAY), {
      from: "2026-05-14",
      to: "2026-08-14",
    })
    assert.deepEqual(windowFor("last-12-months", TODAY), {
      from: "2025-08-14",
      to: "2026-08-14",
    })
  })

  it("crosses a year boundary without losing the year", () => {
    assert.deepEqual(windowFor("last-3-months", "2026-01-15"), {
      from: "2025-10-15",
      to: "2026-01-15",
    })
  })

  it("handles a leap day going back twelve months", () => {
    // 29 Feb 2028 minus 12 months has no counterpart in 2027, so it overflows to
    // 1 March. Pinned for the same reason as the case below.
    assert.deepEqual(windowFor("last-12-months", "2028-02-29"), {
      from: "2027-03-01",
      to: "2028-02-29",
    })
  })

  it("INHERITS JavaScript's month overflow — 31 May minus 3 months is 3 March", () => {
    // Not a bug being asserted as correct: it is the behaviour the transactions
    // screen has shipped with, kept deliberately (D3 bought no behaviour change),
    // and pinned here so a future edit has to decide about it rather than trip
    // over it. It widens the window, never narrows it.
    assert.deepEqual(windowFor("last-3-months", "2026-05-31"), {
      from: "2026-03-03",
      to: "2026-05-31",
    })
  })

  it("never produces an inverted or empty window, for any preset", () => {
    for (const { value } of PERIOD_PRESETS) {
      const { from, to } = windowFor(value, TODAY)
      assert.ok(from <= to, `${value} produced ${from} > ${to}`)
    }
  })

  it("keeps every transactions preset that shipped before the strip existed", () => {
    // D3's whole claim is that the shared table is a SUPERSET, so adopting it on
    // the transactions screen changes nothing there.
    const keys = PERIOD_PRESETS.map((p) => p.value)
    for (const inherited of ["this-month", "last-3-months", "last-12-months"]) {
      assert.ok(keys.includes(inherited as never), `${inherited} was dropped`)
    }
  })

  it("defaults to this month", () => {
    assert.equal(DEFAULT_PERIOD_PRESET, "this-month")
    assert.deepEqual(defaultWindow(TODAY), windowFor("this-month", TODAY))
  })
})

describe("presetForWindow — restoring a chip from a window", () => {
  it("round-trips every preset", () => {
    for (const { value } of PERIOD_PRESETS) {
      assert.equal(presetForWindow(windowFor(value, TODAY), TODAY), value)
    }
  })

  it("returns null for a window no preset produces", () => {
    assert.equal(
      presetForWindow({ from: "2026-08-02", to: "2026-08-09" }, TODAY),
      null,
    )
  })

  it("returns null when the same window is read on a different day", () => {
    // "Today" on the 14th is not "today" on the 15th. The strip must stop
    // highlighting the chip rather than claim a stale window is still live.
    const yesterday = windowFor("today", TODAY)
    assert.equal(presetForWindow(yesterday, "2026-08-15"), null)
  })
})

describe("rangeLabel", () => {
  it("names the current day 'Today'", () => {
    assert.equal(rangeLabel({ from: TODAY, to: TODAY }, TODAY), "Today")
  })

  it("names any other single day by its date", () => {
    assert.equal(
      rangeLabel({ from: "2026-08-09", to: "2026-08-09" }, TODAY),
      "09 Aug 2026",
    )
  })

  it("prints a whole calendar month exactly as the old monthLabel did", () => {
    assert.equal(rangeLabel(windowFor("this-month", TODAY), TODAY), "Aug 2026")
  })

  it("prints the year once for a same-year range", () => {
    assert.equal(
      rangeLabel({ from: "2026-05-14", to: "2026-08-14" }, TODAY),
      "14 May – 14 Aug 2026",
    )
  })

  it("prints both years when the range crosses one", () => {
    assert.equal(
      rangeLabel({ from: "2025-08-14", to: "2026-08-14" }, TODAY),
      "14 Aug 2025 – 14 Aug 2026",
    )
  })

  it("does not mistake a partial month for a whole one", () => {
    assert.equal(
      rangeLabel({ from: "2026-08-01", to: "2026-08-14" }, TODAY),
      "01 Aug – 14 Aug 2026",
    )
  })
})

describe("isDefaultWindowKey — the offline-persistence gate", () => {
  it("persists keys that carry no window at all", () => {
    assert.equal(isDefaultWindowKey(["booker-contacts", "vendor-1"], TODAY), true)
    assert.equal(isDefaultWindowKey([], TODAY), true)
  })

  it("persists a key carrying the default window", () => {
    const { from, to } = defaultWindow(TODAY)
    assert.equal(
      isDefaultWindowKey(["dashboard-stats", "vendor-1", from, to], TODAY),
      true,
    )
  })

  it("does NOT persist a key carrying any other window", () => {
    const { from, to } = windowFor("last-12-months", TODAY)
    assert.equal(
      isDefaultWindowKey(["dashboard-stats", "vendor-1", from, to], TODAY),
      false,
    )
  })

  it("reads the window past a bookings key's status element", () => {
    const { from, to } = windowFor("today", TODAY)
    assert.equal(
      isDefaultWindowKey(["bookings", "vendor-1", "completed", from, to], TODAY),
      false,
    )
  })

  it("treats a non-date tail as 'no window', not as a mismatch", () => {
    // The bookings key ends in a joined status list when no window is set. Reading
    // that as a window would stop the list persisting offline entirely.
    assert.equal(
      isDefaultWindowKey(["bookings", "vendor-1", "pending,returned"], TODAY),
      true,
    )
  })
})

describe("parseWindowParam — params can come from a deep link", () => {
  it("accepts a well-formed pair", () => {
    assert.deepEqual(parseWindowParam("2026-08-01", "2026-08-14"), {
      from: "2026-08-01",
      to: "2026-08-14",
    })
  })

  it("accepts a single-day window", () => {
    assert.deepEqual(parseWindowParam(TODAY, TODAY), { from: TODAY, to: TODAY })
  })

  it("rejects a missing half", () => {
    assert.equal(parseWindowParam("2026-08-01", undefined), null)
    assert.equal(parseWindowParam(undefined, "2026-08-14"), null)
  })

  it("rejects a repeated param, which expo-router surfaces as an array", () => {
    assert.equal(parseWindowParam(["2026-08-01"], "2026-08-14"), null)
  })

  it("rejects a malformed date", () => {
    assert.equal(parseWindowParam("01-08-2026", "2026-08-14"), null)
    assert.equal(parseWindowParam("2026-8-1", "2026-08-14"), null)
  })

  it("rejects a date that matches the pattern but does not exist", () => {
    assert.equal(parseWindowParam("2026-02-30", "2026-08-14"), null)
    assert.equal(parseWindowParam("2026-13-01", "2026-12-01"), null)
  })

  it("rejects an inverted range", () => {
    assert.equal(parseWindowParam("2026-08-14", "2026-08-01"), null)
  })
})

function inclusiveDays({ from, to }: { from: string; to: string }): number {
  const ms =
    new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()
  return Math.round(ms / 86_400_000) + 1
}
