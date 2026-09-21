export type CloseOutStage =
  | "awaiting_payment"
  | "awaiting_approval"
  | "confirmed_session"
  | "confirmed_custody"
  | "ready"
  | "returned"
  | "on_hold"
  | "completed"
  | "cancelled"
  | "refunded"

const STAGES = new Set<CloseOutStage>([
  "awaiting_payment", "awaiting_approval", "confirmed_session", "confirmed_custody",
  "ready", "returned", "on_hold", "completed", "cancelled", "refunded",
])

const ACTION: Record<string, { label: string; sub: string }> = {
  in_progress: { label: "I've returned it", sub: "With you now" },
  fulfilled: { label: "Yes, all done", sub: "Waiting on your confirmation" },
}

const MESSAGE: Record<Exclude<CloseOutStage, "ready">, string> = {
  awaiting_payment: "This booking hasn't been paid. Please see the front desk.",
  awaiting_approval: "Your booking is awaiting vendor approval.",
  confirmed_session: "Your booking is confirmed. Once the vendor marks the service as done, you can finish it here.",
  confirmed_custody: "Your booking is confirmed. Once the vendor hands it over, you can return it here.",
  returned: "You've returned it. The vendor will confirm they got it back.",
  on_hold: "This booking is on hold. Please see the front desk.",
  completed: "This booking has already been completed.",
  cancelled: "This booking was cancelled.",
  refunded: "This booking was cancelled and refunded.",
}

export interface CloseOutBooking {
  id: string
  offeringName: string
  stage: CloseOutStage
  status: string
  bookedDate?: string
  startTime?: string | null
}

export interface CloseOutItem {
  id: string
  offeringName: string
  when: string | null
  action: { label: string; sub: string } | null
  message: string | null
}

export function normaliseCloseOutIdentifier(value: string): string {
  return value.trim()
}

export function parseCloseOutBookings(value: unknown): CloseOutBooking[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as { bookings?: unknown }).bookings)) return []
  return (value as { bookings: unknown[] }).bookings.flatMap(row => {
    if (!row || typeof row !== "object") return []
    const item = row as Record<string, unknown>
    if (typeof item.id !== "string" || !item.id || typeof item.offeringName !== "string" || !item.offeringName
      || typeof item.stage !== "string" || !STAGES.has(item.stage as CloseOutStage)
      || typeof item.status !== "string") return []
    if (item.bookedDate !== undefined && typeof item.bookedDate !== "string") return []
    if (item.startTime !== undefined && item.startTime !== null && typeof item.startTime !== "string") return []
    return [{
      id: item.id,
      offeringName: item.offeringName,
      stage: item.stage as CloseOutStage,
      status: item.status,
      bookedDate: item.bookedDate as string | undefined,
      startTime: item.startTime as string | null | undefined,
    }]
  })
}

function displayDate(bookedDate: string): string {
  return new Date(`${bookedDate}T00:00:00Z`).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila", weekday: "short", day: "numeric", month: "short",
  })
}

export function closeOutItem(booking: CloseOutBooking): CloseOutItem {
  const action = booking.stage === "ready" ? ACTION[booking.status] ?? null : null
  return {
    id: booking.id,
    offeringName: booking.offeringName,
    when: action && booking.bookedDate
      ? `${displayDate(booking.bookedDate)}${booking.startTime ? ` · ${booking.startTime.slice(0, 5)}` : ""}`
      : null,
    action,
    message: booking.stage === "ready" ? null : MESSAGE[booking.stage],
  }
}

export function closeOutDoneMessage(status: "returned" | "completed"): string {
  return status === "returned"
    ? "Thanks — the front desk will confirm it from here."
    : "Thanks — that's all done."
}
