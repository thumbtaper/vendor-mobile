import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AppState } from "react-native"
import { canPayKioskReceipt, createKioskCheckoutAttempt, isKioskReceiptConfirmed, type KioskCheckoutSelection, type KioskReceipt } from "@/lib/kioskCheckout"
import { normaliseKioskPhone, validKioskCustomer, type KioskCustomer } from "@/lib/kioskCustomer"
import { normaliseSignaturePng } from "@/lib/kioskSignature"
import { requirementsFor } from "@/lib/kioskSteps"
import { fmtBookingSpan, fmtPeso, fmtPhDate } from "@/lib/format"
import { queryClient } from "@/lib/queryClient"
import type { OfferingAttachment } from "@/lib/types"
import { spacing } from "@/theme/tokens"
import { createKioskBooking, createKioskPaymentSession } from "@/services/kioskApi"
import { getKioskReceipt } from "@/services/kioskPayment.service"
import { useAppTheme } from "@/theme/useAppTheme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { makeStyles } from "./KioskCheckout.styles"

export interface KioskCheckoutProps {
  selection: KioskCheckoutSelection
  customer: KioskCustomer
  documents: OfferingAttachment[]
  signature: string | null
  payment: (url: string) => Promise<void>
  onBack: () => void
  onDone: () => void
}

export function useKioskCheckout({ selection, customer, documents, signature, payment, onDone }: KioskCheckoutProps) {
  const { tokens } = useAppTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const live = useRef(true)
  const busy = useRef(false)
  const startedOnce = useRef(false)
  const [started, setStarted] = useState(false)
  const [working, setWorking] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<KioskReceipt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [sessionFailed, setSessionFailed] = useState(false)
  const [pollUntil, setPollUntil] = useState(0)
  const [attempt] = useState(() => createKioskCheckoutAttempt(
    () => createKioskBooking({
      vendorId: selection.vendorId, offeringId: selection.offeringId,
      scheduleId: selection.scheduleId, occurrenceDate: selection.occurrenceDate,
      startTime: selection.startTime, quantity: selection.quantity,
      customer: { fullName: customer.fullName.trim(), email: customer.email.trim(), phone: normaliseKioskPhone(customer.phone) ?? "" },
      legalVersion: "", agreedAttachmentIds: documents.map(d => d.id),
      ...(signature ? { signatureBase64: signature, signerName: customer.fullName.trim() } : {}),
    }),
    id => createKioskPaymentSession(selection.vendorId, id),
  ))
  useEffect(() => { live.current = true; return () => { live.current = false } }, [])

  const invalidate = useCallback(() => {
    for (const key of ["bookings", "dashboard-stats", "booking-filter-counts", "transactions-first-page", "transaction-totals"]) {
      void queryClient.invalidateQueries({ queryKey: [key, selection.vendorId], refetchType: "none" })
    }
  }, [selection.vendorId])

  const read = useCallback(async (id: string) => {
    const result = await getKioskReceipt(selection.vendorId, id)
    if (!live.current) return null
    setReceipt(result)
    if (result.paid) invalidate()
    return result
  }, [selection.vendorId, invalidate])

  const refresh = useCallback(async () => {
    if (!bookingId || busy.current || !live.current || AppState.currentState !== "active") return
    busy.current = true; setWorking(true); setError(null)
    try { await read(bookingId) }
    catch { if (live.current) { setReceipt(null); setError("Payment status is unavailable. Check again before making another payment.") } }
    finally { busy.current = false; if (live.current) setWorking(false) }
  }, [bookingId, read])

  useEffect(() => {
    if (!bookingId || receipt?.paid || !pollUntil) return
    const timer = setInterval(() => {
      if (Date.now() >= pollUntil) { clearInterval(timer); return }
      void refresh()
    }, 5000)
    return () => clearInterval(timer)
  }, [bookingId, receipt?.paid, pollUntil, refresh])

  useEffect(() => {
    if (!bookingId || receipt?.paid) return
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") void refresh()
    })
    return () => subscription.remove()
  }, [bookingId, receipt?.paid, refresh])

  const create = useCallback(async () => {
    if (busy.current || startedOnce.current || !live.current) return
    if (!validKioskCustomer(customer) || (requirementsFor(documents).needsSignature && (!signature || !normaliseSignaturePng(signature)))) {
      setError("Please go back and complete your details and signature."); return
    }
    startedOnce.current = true; busy.current = true
    setStarted(true); setWorking(true); setError(null)
    let createdId: string | null = null
    try {
      const booking = await attempt.book()
      if (!live.current) return
      if (typeof booking.bookingId !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(booking.bookingId)) throw new Error("Unknown booking result")
      createdId = booking.bookingId
      setBookingId(createdId)
      invalidate()
      await read(createdId)
    } catch {
      if (live.current) setError(createdId
        ? "Your booking was created, but its payment status is unavailable. Check again or see staff."
        : "We could not confirm whether your booking was created. Please see staff before trying again.")
    } finally { busy.current = false; if (live.current) setWorking(false) }
  }, [attempt, customer, documents, signature, read, invalidate])

  const pay = useCallback(async () => {
    if (!bookingId || busy.current || !live.current || sessionFailed) return
    busy.current = true; setWorking(true); setError(null)
    try {
      const current = await read(bookingId)
      if (!current || !canPayKioskReceipt(current)) return
      let url = checkoutUrl
      if (!url) {
        try {
          const session = await attempt.payment(bookingId)
          if (!live.current) return
          const parsed = new URL(session.checkout_url)
          if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("Invalid checkout link")
          url = parsed.toString()
          setCheckoutUrl(url)
        } catch {
          if (live.current) {
            setSessionFailed(true)
            setError("Your booking exists, but payment setup could not be confirmed. Please see staff; do not start another booking.")
          }
          return
        }
      }
      if (!live.current) return
      try { await payment(url) }
      catch { if (live.current) setError("The payment browser could not complete its return. Check payment status before reopening it.") }
      if (!live.current) return
      setPollUntil(Date.now() + 60_000)
      await read(bookingId)
    } catch {
      if (live.current) { setReceipt(null); setError("Payment status is unavailable. Check again before making another payment.") }
    } finally { busy.current = false; if (live.current) setWorking(false) }
  }, [bookingId, sessionFailed, checkoutUrl, attempt, read, payment])

  return {
    tokens, styles, started, working, bookingId, receipt, error, sessionFailed, create, pay, refresh,
    actionBarPaddingBottom: Math.max(spacing.md, insets.bottom),
    canPay: !!receipt && canPayKioskReceipt(receipt) && !sessionFailed,
    confirmed: isKioskReceiptConfirmed(receipt),
    payLabel: checkoutUrl ? "Reopen payment" : "Pay with PayMongo",
    heading: !started ? "Review booking" : receipt?.paid
      ? receipt.status === "refunded" ? "Payment refunded" : receipt.amount === 0 ? "Booking confirmed" : "Payment confirmed"
      : "Booking and payment",
    estimate: fmtPeso(selection.estimate), selectedDate: fmtPhDate(selection.bookedDate),
    amount: receipt ? fmtPeso(receipt.amount) : null,
    receiptDate: receipt ? fmtPhDate(receipt.bookedDate) : null,
    receiptSpan: receipt ? fmtBookingSpan({
      bookedDate: receipt.bookedDate, startTime: receipt.startTime,
      endTime: receipt.endTime, endDate: receipt.endDate,
    }) : null,
    done: useCallback(() => { live.current = false; attempt.dispose(); onDone() }, [attempt, onDone]),
  }
}
