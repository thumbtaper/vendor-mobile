import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { formatWindow, formatWindowLength, crossesMidnight, formatScheduleWhen } from "./scheduleWindow.ts"

describe("crossesMidnight", () => {
  it("is false for an ordinary daytime window", () => {
    assert.equal(crossesMidnight("09:00", 180), false)
  })
  it("is false for a window ending exactly at midnight — that is its OWN day's end", () => {
    assert.equal(crossesMidnight("22:00", 120), false)
    assert.equal(crossesMidnight("00:00", 1440), false)
  })
  it("is true one minute past that boundary", () => {
    assert.equal(crossesMidnight("22:00", 121), true)
  })
  it("is true for the overnight case", () => {
    assert.equal(crossesMidnight("23:00", 120), true)
  })
})

describe("formatWindow", () => {
  it("renders an ordinary window unmarked", () => {
    assert.equal(formatWindow("09:00", 180), "09:00 – 12:00")
  })
  it("marks a window that finishes the next day", () => {
    assert.equal(formatWindow("23:00", 120), "23:00 – 01:00 (+1)")
  })
  it("renders a window closing at midnight as 24:00, unmarked", () => {
    // "00:00 (+1)" would be technically true and read as a different day entirely.
    assert.equal(formatWindow("22:00", 120), "22:00 – 24:00")
  })
  it("renders a full day as 00:00 – 24:00", () => {
    assert.equal(formatWindow("00:00", 1440), "00:00 – 24:00")
  })
  it("degrades honestly when there is no length yet", () => {
    assert.equal(formatWindow("09:00", null), "09:00")
    assert.equal(formatWindow(null, 180), "")
  })
})

describe("formatWindowLength", () => {
  it("says hours, minutes, or both", () => {
    assert.equal(formatWindowLength(120), "2 hours")
    assert.equal(formatWindowLength(60), "1 hour")
    assert.equal(formatWindowLength(45), "45 minutes")
    assert.equal(formatWindowLength(90), "1 hour 30 minutes")
    assert.equal(formatWindowLength(1440), "24 hours")
  })
})

describe("formatScheduleWhen — both granularities", () => {
  const timed = { time: "09:00", windowMinutes: 180, date: "2026-05-01", endDate: null }
  const overnight = { time: "23:00", windowMinutes: 120, date: "2026-05-01", endDate: null }
  const ranged = { time: null, windowMinutes: null, date: "2026-04-01", endDate: "2026-12-31" }
  const openEnded = { time: null, windowMinutes: null, date: "2026-04-01", endDate: null }

  it("renders a time-granular window", () => {
    assert.equal(formatScheduleWhen(timed), "09:00 – 12:00")
  })
  it("marks an overnight one", () => {
    assert.equal(formatScheduleWhen(overnight), "23:00 – 01:00 (+1)")
  })
  it("renders a date-granular RANGE, never 'null - null'", () => {
    // The regression: CalendarPage formatted these as a window and shipped the literal
    // string "null - null" to vendors, hidden by a baseline that had recorded it.
    assert.equal(formatScheduleWhen(ranged), "2026-04-01 – 2026-12-31")
  })
  it("renders an open-ended date range", () => {
    assert.equal(formatScheduleWhen(openEnded), "From 2026-04-01")
  })
})
