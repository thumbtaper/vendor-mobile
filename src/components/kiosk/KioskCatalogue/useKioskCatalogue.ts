import { useCallback, useEffect, useMemo, useState } from "react"
import { formatDuration } from "@/lib/duration"
import { fmtPeso, phToday } from "@/lib/format"
import { kioskDateChoices, kioskMaxQuantity, kioskSlots, occurringSchedules } from "@/lib/kioskCatalogue"
import type { SlotBooking } from "@/lib/slotAvailability"
import type { OfferingAttachment } from "@/lib/types"
import { getKioskCatalogue, getKioskSlotBookings, kioskPhotoUrl } from "@/services/kiosk.service"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./KioskCatalogue.styles"

export function useKioskCatalogue(vendorId: string) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
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
  const dates = kioskDateChoices(phToday())

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
  const occurring = useMemo(() => catalogue && offeringId
    ? occurringSchedules(catalogue.schedules, offeringId, date) : [], [catalogue, offeringId, date])
  const readKey = `${vendorId}:${offeringId}:${date}:${refresh}`
  useEffect(() => {
    if (!offeringId) return
    let cancelled = false
    getKioskSlotBookings(vendorId, occurring.map(s => s.id), date).then(bookings => {
      if (!cancelled) setOccupancy({ key: readKey, bookings, error: null })
    }).catch(failure => {
      if (!cancelled) setOccupancy({ key: readKey, bookings: [],
        error: failure instanceof Error ? failure.message : "Cannot load availability. Please retry." })
    })
    return () => { cancelled = true }
  }, [vendorId, offeringId, occurring, date, readKey])

  const retryAvailability = useCallback(() => {
    setSlotId(null); setQuantity(1); setRefresh(value => value + 1)
  }, [])
  useEffect(() => {
    if (!offeringId || customerDocuments) return
    const timer = setTimeout(retryAvailability, 60_000)
    return () => clearTimeout(timer)
  }, [offeringId, refresh, retryAvailability, customerDocuments])

  const loaded = occupancy?.key === readKey
  const bookings = loaded && !occupancy.error ? occupancy.bookings : null
  const slots = useMemo(() => bookings ? kioskSlots(occurring, bookings, date) : [], [occurring, bookings, date])
  const slot = slots.find(s => s.id === slotId) ?? null
  const maxQuantity = slot && bookings ? kioskMaxQuantity(slot, bookings, date) : 0
  const retryCatalogue = useCallback(() => {
    setCatalogue(null); setError(null); setAttempt(value => value + 1)
  }, [])
  const back = useCallback(() => { setOfferingId(null); setSlotId(null); setQuantity(1) }, [])
  return {
    styles, tokens, offering, error, loading: !catalogue && !error, retryCatalogue, back,
    customerDocuments,
    continueCustomer: useCallback(() => {
      if (!offering || !slot || quantity < 1 || quantity > maxQuantity || !catalogue) return
      setCustomerDocuments(catalogue.attachments.filter(d => d.offeringId === offering.id && d.isActive && d.kind === "document"))
    }, [offering, slot, quantity, maxQuantity, catalogue]),
    backToSlots: useCallback(() => { setCustomerDocuments(null); retryAvailability() }, [retryAvailability]),
    offerings: (catalogue?.eligible ?? []).map(o => ({
      ...o, priceLabel: `${fmtPeso(o.price)} / ${formatDuration(o.durationMinutes, o.durationUnit)}`,
      photos: (catalogue?.attachments ?? []).filter(a => a.offeringId === o.id && a.kind === "photo")
        .map(a => ({ id: a.id, url: kioskPhotoUrl(a), title: a.title,
          failed: failedPhotos.has(a.id),
          onError: () => setFailedPhotos(previous => new Set(previous).add(a.id)) })),
      onPress: () => { setOfferingId(o.id); setDate(phToday()); setSlotId(null); setQuantity(1) },
    })),
    dates: dates.map(d => ({ ...d, selected: d.value === date, onPress: () => {
      setDate(d.value); setSlotId(null); setQuantity(1)
    } })),
    slots: slots.map(s => ({ ...s, selected: s.id === slotId,
      onPress: () => { if (s.remaining > 0) { setSlotId(s.id); setQuantity(1) } } })),
    availabilityLoading: Boolean(offeringId) && !loaded,
    availabilityError: loaded ? occupancy.error : null,
    retryAvailability, slot, quantity, maxQuantity,
    durationLabel: offering ? formatDuration(offering.durationMinutes, offering.durationUnit) : "",
    decrease: useCallback(() => setQuantity(value => Math.max(1, value - 1)), []),
    increase: useCallback(() => setQuantity(value => Math.min(maxQuantity, value + 1)), [maxQuantity]),
  }
}
