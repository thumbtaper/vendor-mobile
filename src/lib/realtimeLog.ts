// Diagnostics for the postgres_changes subscriptions (plan B1).
//
// Both realtime hooks used to log ONLY `CHANNEL_ERROR` and `TIMED_OUT`, which
// makes the two failures we actually need to tell apart look identical — a
// socket that never joined and a joined channel receiving nothing both print
// nothing at all. Every status is logged here so the log answers the question
// on its own.
//
// ⚠️ NEVER log the payload row. Booking and notification payloads carry booker
// PII; only the event type and the row id go to the console.

// Typed as a plain string rather than realtime-js's `REALTIME_SUBSCRIBE_STATES`
// enum: that enum is not re-exported from `@supabase/supabase-js`, and reaching
// into the transitive package to type a console line is a coupling this module
// does not need. The enum's members are strings, so they pass straight through.
//
// `SUBSCRIBED`/`CLOSED` are noise in a release build, so they are dev-only. The
// two failure statuses are warned in every build — a vendor reporting "it went
// quiet" is worth a line in a production log.
const FAILURE_STATUSES = ["CHANNEL_ERROR", "TIMED_OUT"]

export function logChannelStatus(
  tag: string,
  status: string,
  error?: Error,
): void {
  if (FAILURE_STATUSES.includes(status)) {
    console.warn(`[${tag}] channel ${status}`, error?.message ?? "")
    return
  }
  if (__DEV__) console.log(`[${tag}] channel ${status}`)
}

export function logChannelPayload(
  tag: string,
  event: string,
  rowId: unknown,
): void {
  if (__DEV__) console.log(`[${tag}] ${event} ${String(rowId)}`)
}
