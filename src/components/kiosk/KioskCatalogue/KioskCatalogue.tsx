import { Check, Minus, Plus } from "lucide-react-native"
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { KioskBackButton } from "../KioskBackButton/KioskBackButton"
import { useKioskCatalogue } from "./useKioskCatalogue"
import { KioskCustomerForm } from "../KioskCustomerForm/KioskCustomerForm"

export function KioskCatalogue({ vendorId, onHome, review, payment }: { vendorId: string; onHome: () => void; review: (url: string) => Promise<void>; payment: (url: string) => Promise<void> }) {
  const s = useKioskCatalogue(vendorId)
  type Card = (typeof s.offerings)[number] & { badge?: string; detail?: string }
  const renderCard = (o: Card) => <View key={o.id} style={s.styles.card}>
    <View style={s.styles.photos}>
      {o.photo?.url && !o.photo.failed ? <>
        <Image source={{ uri: o.photo.url }} style={s.styles.photoBackdrop} resizeMode="cover" blurRadius={18} accessible={false} />
        <Image source={{ uri: o.photo.url }} style={s.styles.photo} resizeMode="contain" accessibilityLabel={o.photo.title || o.name} onError={o.photo.onError} />
      </> : <View style={s.styles.photoCode} accessibilityLabel={`${o.name}, ${o.code} image placeholder`}>
        <Text style={[s.styles.photoCodeText, o.code.length > 4 && s.styles.photoCodeLong]}>{o.code}</Text>
      </View>}
    </View>
    {o.badge ? <Text style={s.styles.badge}>{o.badge}</Text> : null}
    <Text style={s.styles.heading}>{o.name}</Text>
    {o.description ? <Text style={s.styles.text}>{o.description}</Text> : null}
    <Text style={s.styles.text}>{o.priceLabel}</Text>
    {o.detail ? <Text style={s.styles.muted}>{o.detail}</Text> : null}
    <PrimaryButton label="Choose" onPress={o.onPress} />
  </View>
  if (s.customerDocuments && s.checkoutSelection) return <KioskCustomerForm selection={s.checkoutSelection} documents={s.customerDocuments} onBack={s.backToSlots} review={review} payment={payment} onDone={onHome} />
  return <View style={s.styles.frame}>
    <View style={s.styles.stepHeader}>
      <KioskBackButton accessibilityLabel={s.offering ? "Back to offerings" : "Back to welcome"} onPress={s.offering ? s.back : onHome} />
      <Text style={s.styles.stepLabel}>Booking · {s.offering ? "Choose a time" : "Choose an offering"}</Text>
    </View>
    <ScrollView style={s.styles.scroll} contentContainerStyle={s.styles.content} keyboardShouldPersistTaps="handled">
    <Text style={s.styles.heading} accessibilityRole="header">{s.offering ? s.offering.name : "Choose an offering"}</Text>
    {s.loading ? <ActivityIndicator accessibilityLabel="Loading offerings" /> : null}
    {s.error ? <>
      <Text style={s.styles.text} accessibilityRole="alert">{s.error}</Text>
      <PrimaryButton label="Retry" onPress={s.retryCatalogue} />
    </> : null}
    {!s.offering ? <>
      {s.availabilityLoading ? <ActivityIndicator accessibilityLabel="Checking availability" /> : null}
      {s.availabilityError ? <Text style={s.styles.text} accessibilityRole="alert">{s.availabilityError}</Text> : null}
      {!s.loading && !s.error && s.offerings.length === 0 ? <Text style={s.styles.text}>No offerings are available. Please see staff.</Text> : null}
      {s.offeringGroups ? <>
        {s.offeringGroups.today.length > 0 ? <View style={s.styles.group}>
          <Text style={s.styles.groupHeading}>Available today · {s.offeringGroups.todayLabel}</Text>
          {s.offeringGroups.today.map(renderCard)}
        </View> : null}
        {s.offeringGroups.later.length > 0 ? <View style={s.styles.group}>
          <Text style={s.styles.groupHeading}>Later this week</Text>
          {s.offeringGroups.later.map(renderCard)}
        </View> : null}
        {s.offeringGroups.none.length > 0 ? <View style={s.styles.group}>
          <Text style={s.styles.groupHeading}>Not available this week</Text>
          {s.offeringGroups.none.map(o => <View key={o.id} style={s.styles.noneRow}>
            <Text style={s.styles.noneName}>{o.name}</Text>
            <Text style={s.styles.muted}>{o.detail ?? "No free times in the next 7 days"}</Text>
          </View>)}
        </View> : null}
      </> : s.offerings.map(renderCard)}
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
      </> : null}
    </>}
    </ScrollView>
    <View style={[s.styles.actionBar, { paddingBottom: s.actionBarPaddingBottom }]}>
      <View style={s.styles.actionSummary}>
        <Text style={s.styles.actionTitle}>{s.offering ? s.offering.name : "Choose an offering"}</Text>
        <Text style={s.styles.muted}>{s.slot ? `${s.slot.ownDate} at ${s.slot.start} · ${s.quantity} selected · ${s.durationLabel} · ${s.totalLabel}` : "Select a time to continue"}</Text>
      </View>
      <View style={s.styles.actionButtons}>
        {s.offering ? <PrimaryButton label="Refresh availability" variant="secondary" onPress={s.retryAvailability} disabled={s.availabilityLoading} /> : null}
        {s.offering ? <PrimaryButton label="Continue" onPress={s.continueCustomer} disabled={!s.slot || s.quantity < 1 || s.quantity > s.maxQuantity} /> : null}
      </View>
    </View>
  </View>
}
