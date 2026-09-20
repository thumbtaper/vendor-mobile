import { CircleCheckBig } from "lucide-react-native"
import { Image, ScrollView, Text, View } from "react-native"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { useKioskCheckout, type KioskCheckoutProps } from "./useKioskCheckout"

export function KioskCheckout(props: KioskCheckoutProps) {
  const s = useKioskCheckout(props)
  return <View style={s.styles.frame}>
    <View style={s.styles.stepHeader}>
      {!s.started ? <PrimaryButton label="Back" variant="secondary" onPress={props.onBack} /> : null}
      <Text style={s.styles.stepLabel}>Booking · Review and payment</Text>
    </View>
    <ScrollView style={s.styles.scroll} contentContainerStyle={s.styles.content}>
    <Text style={s.styles.heading} accessibilityRole="header">{s.heading}</Text>
    {!s.started ? <>
      <Text style={s.styles.text}>{props.selection.offeringName}</Text>
      <Text style={s.styles.text}>{s.selectedDate} at {props.selection.startTime}</Text>
      <Text style={s.styles.text}>Quantity: {props.selection.quantity}</Text>
      <Text style={s.styles.text}>{props.customer.fullName}</Text>
      <Text style={s.styles.text}>{props.customer.email}</Text>
      <Text style={s.styles.amount}>Estimated total: {s.estimate}</Text>
      <Text style={s.styles.muted}>The final amount is confirmed when the booking is created.</Text>
      {props.signature ? <Image source={{ uri: `data:image/png;base64,${props.signature}` }} style={s.styles.signature} resizeMode="contain" accessibilityLabel="Captured signature" /> : null}
    </> : <>
      {s.bookingId ? <Text style={s.styles.text}>Booking reference: {s.bookingId}</Text> : null}
      {s.confirmed && s.receipt ? <View style={s.styles.confirmation} accessibilityLiveRegion="polite">
        <CircleCheckBig size={40} color={s.tokens.status.confirmed.fg} accessible={false} />
        <Text style={s.styles.confirmationTitle}>You&apos;re booked</Text>
        <Text style={s.styles.text}>Payment confirmed. A confirmation is on its way to {props.customer.email}.</Text>
        <Text style={s.styles.text}>Booking reference: {s.bookingId}</Text>
        <Text style={s.styles.text}>{s.receipt.offering}</Text>
        <Text style={s.styles.text}>{s.receiptDate}</Text>
        <Text style={s.styles.text}>{s.receiptSpan}</Text>
        <Text style={s.styles.amount}>{s.amount}</Text>
      </View> : s.receipt ? <>
        <Text style={s.styles.text}>{s.receipt.offering}</Text>
        <Text style={s.styles.text}>{s.receiptDate}</Text>
        <Text style={s.styles.text}>{s.receiptSpan}</Text>
        <Text style={s.styles.amount}>{s.amount}</Text>
        <Text style={s.styles.text}>{s.receipt.status === "refunded" ? "Payment was refunded. Please see staff." : "Payment is not confirmed."}</Text>
        {!s.receipt.paid ? <Text style={s.styles.text} accessibilityLiveRegion="polite">Payment is not confirmed. If you have paid, please wait and check again.</Text> : null}
      </> : null}
      {s.canPay ? <>
        <Text style={s.styles.muted}>After payment, close the browser to return here. Confirmation may take a moment.</Text>
      </> : null}
      {s.working && !s.bookingId ? <Text style={s.styles.text} accessibilityLiveRegion="polite">Creating booking...</Text> : null}
    </>}
    {s.error ? <Text style={s.styles.text} accessibilityRole="alert">{s.error}</Text> : null}
    </ScrollView>
    <View style={[s.styles.actionBar, { paddingBottom: s.actionBarPaddingBottom }]}>
      {!s.started ? <PrimaryButton label="Create booking" onPress={s.create} loading={s.working} /> : null}
      {s.started && s.canPay ? <PrimaryButton label={s.payLabel} onPress={s.pay} loading={s.working} /> : null}
      {s.started && s.bookingId && !s.confirmed ? <PrimaryButton label="Check payment status" variant="secondary" onPress={s.refresh} loading={s.working} /> : null}
      {s.started && !s.working ? <PrimaryButton label="Done" variant="secondary" onPress={s.done} /> : null}
    </View>
  </View>
}
