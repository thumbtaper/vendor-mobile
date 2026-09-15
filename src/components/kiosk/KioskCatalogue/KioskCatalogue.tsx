import { Check, Minus, Plus } from "lucide-react-native"
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { useKioskCatalogue } from "./useKioskCatalogue"
import { KioskCustomerForm } from "../KioskCustomerForm/KioskCustomerForm"

export function KioskCatalogue({ vendorId, onHome, review }: { vendorId: string; onHome: () => void; review: (url: string) => Promise<void> }) {
  const s = useKioskCatalogue(vendorId)
  if (s.customerDocuments && s.offering) return <KioskCustomerForm vendorId={vendorId} offeringId={s.offering.id} documents={s.customerDocuments} onBack={s.backToSlots} review={review} />
  return <View style={s.styles.content}>
    <PrimaryButton label={s.offering ? "Back to offerings" : "Back to welcome"} variant="secondary" onPress={s.offering ? s.back : onHome} />
    <Text style={s.styles.heading} accessibilityRole="header">{s.offering ? s.offering.name : "Choose an offering"}</Text>
    {s.loading ? <ActivityIndicator accessibilityLabel="Loading offerings" /> : null}
    {s.error ? <>
      <Text style={s.styles.text} accessibilityRole="alert">{s.error}</Text>
      <PrimaryButton label="Retry" onPress={s.retryCatalogue} />
    </> : null}
    {!s.offering ? <>
      {!s.loading && !s.error && s.offerings.length === 0 ? <Text style={s.styles.text}>No offerings are available. Please see staff.</Text> : null}
      {s.offerings.map(o => <View key={o.id} style={s.styles.card}>
        <View style={s.styles.photos}>
          {o.photos.map(p => p.url && !p.failed ? <Image key={p.id} source={{ uri: p.url }} style={s.styles.photo} resizeMode="contain" accessibilityLabel={p.title || o.name} onError={p.onError} />
            : <Text key={p.id} style={s.styles.muted}>Photo unavailable</Text>)}
        </View>
        <Text style={s.styles.heading}>{o.name}</Text>
        {o.description ? <Text style={s.styles.text}>{o.description}</Text> : null}
        <Text style={s.styles.text}>{o.priceLabel}</Text>
        <PrimaryButton label="Choose" onPress={o.onPress} />
      </View>)}
    </> : <>
      <Text style={s.styles.text}>Date</Text>
      <View style={s.styles.grid} accessibilityRole="radiogroup">
        {s.dates.map(d => <Pressable key={d.value} onPress={d.onPress} accessibilityRole="radio" accessibilityState={{ selected: d.selected }}
          accessibilityLabel={`${d.label}, ${d.detail}`} style={[s.styles.choice, d.selected && s.styles.selected]}>
          <Text style={s.styles.text}>{d.label}</Text><Text style={s.styles.muted}>{d.detail}</Text>
          {d.selected ? <Check size={18} color={s.tokens.accent} /> : null}
        </Pressable>)}
      </View>
      <Text style={s.styles.text}>Start time</Text>
      {s.availabilityLoading ? <ActivityIndicator accessibilityLabel="Checking availability" /> : null}
      {s.availabilityError ? <Text style={s.styles.text} accessibilityRole="alert">{s.availabilityError}</Text> : null}
      {!s.availabilityLoading && !s.availabilityError && s.slots.length === 0 ? <Text style={s.styles.muted}>No times available for this date.</Text> : null}
      <View style={s.styles.grid} accessibilityRole="radiogroup">
        {s.slots.map(slot => <Pressable key={slot.id} onPress={slot.onPress} disabled={slot.remaining < 1}
          accessibilityRole="radio" accessibilityState={{ selected: slot.selected, disabled: slot.remaining < 1 }}
          accessibilityLabel={`${slot.ownDate}, ${slot.start}, ${slot.remaining} available`}
          style={[s.styles.choice, slot.selected && s.styles.selected, slot.remaining < 1 && s.styles.disabled]}>
          <Text style={s.styles.text}>{slot.start}</Text>
          {slot.nextDay ? <Text style={s.styles.text}>Next day: {slot.ownDate}</Text> : null}
          <Text style={s.styles.muted}>{slot.remaining > 0 ? `${slot.remaining} available` : "Full"}</Text>
          {slot.selected ? <Check size={18} color={s.tokens.accent} /> : null}
        </Pressable>)}
      </View>
      <PrimaryButton label="Refresh availability" variant="secondary" onPress={s.retryAvailability} disabled={s.availabilityLoading} />
      {s.slot ? <>
        <Text style={s.styles.text}>Quantity ({s.durationLabel} each)</Text>
        <View style={s.styles.row}>
          <Pressable style={s.styles.icon} onPress={s.decrease} disabled={s.quantity <= 1} accessibilityRole="button" accessibilityLabel="Decrease quantity" accessibilityState={{ disabled: s.quantity <= 1 }}>
            <Minus size={20} color={s.tokens.strong} />
          </Pressable>
          <Text style={s.styles.quantity} accessibilityLiveRegion="polite">{s.quantity}</Text>
          <Pressable style={s.styles.icon} onPress={s.increase} disabled={s.quantity >= s.maxQuantity} accessibilityRole="button" accessibilityLabel="Increase quantity" accessibilityState={{ disabled: s.quantity >= s.maxQuantity }}>
            <Plus size={20} color={s.tokens.strong} />
          </Pressable>
        </View>
        <Text style={s.styles.text}>{s.slot.ownDate} at {s.slot.start}</Text>
        <PrimaryButton label="Continue" onPress={s.continueCustomer} disabled={s.quantity < 1 || s.quantity > s.maxQuantity} />
      </> : null}
    </>}
  </View>
}
