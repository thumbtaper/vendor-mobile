import { useCallback, useEffect, useMemo, useState } from "react"
import { formatDuration } from "@/lib/duration"
import { fmtPeso, phToday } from "@/lib/format"
import { spacing } from "@/theme/tokens"
import type { Gradient } from "@/theme/tokens"
import { kioskDateChoices, kioskMaxQuantity, kioskSlots, occurringSchedules, addCalendarDays } from "@/lib/kioskCatalogue"
import { groupByAvailability, longDayLabel, offeringAvailability, whenAvailable } from "@/lib/kioskAvailability"
import type { SlotBooking } from "@/lib/slotAvailability"
import type { OfferingAttachment } from "@/lib/types"
import { getKioskCatalogue, getKioskSlotBookings, kioskPhotoUrl } from "@/services/kiosk.service"
import { useAppTheme } from "@/theme/useAppTheme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { makeStyles } from "./KioskCatalogue.styles"

const PHOTO_PLACEHOLDER = {
  light: { colors: ["#eff6ff", "#e0edff"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  dark: { colors: ["#0f1b2d", "#132642"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
} satisfies Record<"light" | "dark", Gradient>

export function useKioskCatalogue(vendorId: string) {
  const { tokens, isDark } = useAppTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark])
  const [catalogue, setCatalogue] = useState<Awaited<ReturnType<typeof getKioskCatalogue>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [offeringId, setOfferingId] = useState<string | null>(null)
  const [date, setDate] = useState(phToday)
  const [slotId, setSlotId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [customerDocuments, setCustomerDocuments] = useState<OfferingAttachment[] | null>(null)
  const [occupancy, setOccupancy] = useState<{
    key: string; bookings: SlotBooking[]; error: string | null
  } | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set())
  const [now, setNow] = useState(() => Date.now())
  const today = phToday()
  const dates = useMemo(() => kioskDateChoices(today), [today])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    getKioskCatalogue(vendorId).then(value => {
      if (!cancelled) setCatalogue(value)
    }).catch(() => {
      if (!cancelled) setError("Could not load offerings. Check your connection and retry.")
    })
    return () => { cancelled = true }
  }, [vendorId, attempt])

  const offering = catalogue?.eligible.find(o => o.id === offeringId) ?? null
  const windowKey = `${vendorId}:${today}:${refresh}`
  const occurring = useMemo(() => catalogue && offeringId
    ? occurringSchedules(catalogue.schedules, offeringId, date) : [], [catalogue, offeringId, date])
  useEffect(() => {
    if (!catalogue) return
    let cancelled = false
    getKioskSlotBookings(vendorId, catalogue.schedules.map(s => s.id), today, addCalendarDays(today, 6)).then(bookings => {
      if (!cancelled) setOccupancy({ key: windowKey, bookings, error: null })
    }).catch(failure => {
      if (!cancelled) setOccupancy({ key: windowKey, bookings: [],
        error: failure instanceof Error ? failure.message : "Cannot load availability. Please retry." })
    })
    return () => { cancelled = true }
  }, [catalogue, today, vendorId, windowKey])

  const retryAvailability = useCallback(() => {
    setSlotId(null); setQuantity(1); setRefresh(value => value + 1)
  }, [])
  useEffect(() => {
    if (!offeringId || customerDocuments) return
    const timer = setTimeout(retryAvailability, 60_000)
    return () => clearTimeout(timer)
  }, [offeringId, refresh, retryAvailability, customerDocuments])

  const windowLoaded = occupancy?.key === windowKey
  const loaded = windowLoaded
  const bookings = loaded && !occupancy.error ? occupancy.bookings : null
  const slots = useMemo(() => bookings ? kioskSlots(occurring, bookings, date, now) : [], [occurring, bookings, date, now])
  const slot = slots.find(s => s.id === slotId) ?? null
  const maxQuantity = slot && bookings ? kioskMaxQuantity(slot, bookings, date) : 0
  const retryCatalogue = useCallback(() => {
    setCatalogue(null); setError(null); setAttempt(value => value + 1)
  }, [])
  const back = useCallback(() => { setOfferingId(null); setSlotId(null); setQuantity(1) }, [])
  const availability = useMemo(() => {
    if (!catalogue || !windowLoaded || occupancy?.error) return null
    return new Map(catalogue.eligible.map(o => [o.id, offeringAvailability(
      catalogue.schedules.filter(s => s.offeringId === o.id), occupancy.bookings, dates.map(d => d.value), now,
    )]))
  }, [catalogue, dates, now, occupancy, windowLoaded])
  const cards = useMemo(() => (catalogue?.eligible ?? []).map(o => ({
    ...o, priceLabel: `${fmtPeso(o.price)} / ${formatDuration(o.durationMinutes, o.durationUnit)}`,
    photo: (() => {
      const attachment = (catalogue?.attachments ?? []).find(a => a.offeringId === o.id && a.kind === "photo")
      return attachment ? { id: attachment.id, url: kioskPhotoUrl(attachment), title: attachment.title,
        failed: failedPhotos.has(attachment.id),
        onError: () => setFailedPhotos(previous => new Set(previous).add(attachment.id)) } : null
    })(),
    onPress: () => { setOfferingId(o.id); const first = availability?.get(o.id)?.firstDate; setDate(first ?? today); setSlotId(null); setQuantity(1) },
  })), [availability, catalogue, failedPhotos, today])
  const offeringGroups = useMemo(() => {
    if (!availability) return null
    const groups = groupByAvailability(cards, availability, today)
    const decorate = (card: typeof cards[number]) => {
      const current = availability.get(card.id)
      if (!current || current.firstDate === today) return { ...card, badge: `Today · next ${current?.nextStart ?? ""}`, detail: `${current?.freeCount ?? 0} ${current?.freeCount === 1 ? "time" : "times"} left today` }
      return { ...card, badge: `Available ${whenAvailable(current.firstDate, dates.map(d => d.value))}`, detail: current.bookedOutToday ? "Fully booked today" : longDayLabel(current.firstDate!) }
    }
    return { today: groups.today.map(decorate), later: groups.later.map(decorate), none: groups.none.map(decorate), todayLabel: longDayLabel(today) }
  }, [availability, cards, dates, today])
  return {
    styles, tokens, isDark, photoPlaceholder: PHOTO_PLACEHOLDER[isDark ? "dark" : "light"], offering, error, loading: !catalogue && !error, retryCatalogue, back,
    actionBarPaddingBottom: Math.max(spacing.md, insets.bottom),
    customerDocuments,
    checkoutSelection: offering && slot ? {
      vendorId, offeringId: offering.id, scheduleId: slot.schedule.id,
      occurrenceDate: date, startTime: slot.start, quantity,
      offeringName: offering.name, bookedDate: slot.ownDate, estimate: offering.price * quantity,
    } : null,
    continueCustomer: useCallback(() => {
      if (!offering || !slot || quantity < 1 || quantity > maxQuantity || !catalogue) return
      setCustomerDocuments(catalogue.attachments.filter(d => d.offeringId === offering.id && d.isActive && d.kind === "document"))
    }, [offering, slot, quantity, maxQuantity, catalogue]),
    backToSlots: useCallback(() => { setCustomerDocuments(null); retryAvailability() }, [retryAvailability]),
    dates: dates.map(d => ({ ...d, selected: d.value === date, onPress: () => {
      setDate(d.value); setSlotId(null); setQuantity(1)
    } })),
    slots: slots.map(s => ({ ...s, selected: s.id === slotId,
      onPress: () => { if (s.remaining > 0) { setSlotId(s.id); setQuantity(1) } } })),
    availabilityLoading: Boolean(catalogue) && !windowLoaded,
    availabilityError: loaded ? occupancy.error : null,
    retryAvailability, slot, quantity, maxQuantity,
    durationLabel: offering ? formatDuration(offering.durationMinutes, offering.durationUnit) : "",
    totalLabel: offering ? fmtPeso(offering.price * quantity) : "",
    offeringGroups,
    offerings: offeringGroups ? [...offeringGroups.today, ...offeringGroups.later, ...offeringGroups.none] : cards,
    decrease: useCallback(() => setQuantity(value => Math.max(1, value - 1)), []),
    increase: useCallback(() => setQuantity(value => Math.min(maxQuantity, value + 1)), [maxQuantity]),
  }
}
