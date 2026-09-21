export interface KioskCheckoutSelection {
  vendorId: string
  offeringId: string
  scheduleId: string
  occurrenceDate: string
  startTime: string
  quantity: number
  offeringName: string
  bookedDate: string
  estimate: number
}

export interface KioskReceiptRow {
  id: string
  price_paid: number | string | null
  is_paid: boolean
  status: string
  booked_date: string
  start_time: string | null
  end_time: string | null
  end_date: string | null
  offerings: { name: string } | { name: string }[] | null
}

export function mapKioskReceipt(row: KioskReceiptRow) {
  const offering = Array.isArray(row.offerings) ? row.offerings[0] : row.offerings
  const amount = row.price_paid === null || row.price_paid === "" ? NaN : Number(row.price_paid)
  if (!Number.isFinite(amount) || amount < 0 || typeof row.is_paid !== "boolean" ||
      !offering?.name || !row.id || !row.booked_date || !row.status) {
    throw new Error("Receipt unavailable. Please check again or see staff.")
  }
  return { id: row.id, amount, paid: row.is_paid, status: row.status, offering: offering.name,
    bookedDate: row.booked_date, startTime: row.start_time?.slice(0, 5) ?? "",
    endTime: row.end_time?.slice(0, 5) ?? "", endDate: row.end_date ?? "" }
}
export type KioskReceipt = ReturnType<typeof mapKioskReceipt>

export function canPayKioskReceipt(receipt: KioskReceipt) {
  return !receipt.paid && receipt.amount > 0 && ["pending", "confirmed"].includes(receipt.status)
}

/**
 * A newly-created paid booking can open its first server-authorized checkout session
 * even when the optional direct receipt read is temporarily unavailable.
 */
export function canStartKioskPayment(receipt: KioskReceipt | null, isFreshPaidBooking: boolean) {
  return receipt ? canPayKioskReceipt(receipt) : isFreshPaidBooking
}

/** A settled payment is confirmation unless the booking was subsequently refunded. */
export function isKioskReceiptConfirmed(receipt: KioskReceipt | null): boolean {
  return Boolean(receipt?.paid && receipt.status !== "refunded")
}

/** Cache even a rejection: these server writes have no idempotency key. */
export function createKioskCheckoutAttempt<T extends { bookingId: string }, P>(
  create: () => Promise<T>, session: (bookingId: string) => Promise<P>,
) {
  let booking: Promise<T> | undefined
  let payment: Promise<P> | undefined
  let disposed = false
  return {
    dispose: () => { disposed = true },
    book: () => {
      if (disposed) return Promise.reject(new Error("Checkout ended"))
      booking ??= Promise.resolve().then(create)
      return booking
    },
    payment: (bookingId: string) => {
      if (disposed) return Promise.reject(new Error("Checkout ended"))
      payment ??= Promise.resolve().then(() => session(bookingId))
      return payment
    },
  }
}
