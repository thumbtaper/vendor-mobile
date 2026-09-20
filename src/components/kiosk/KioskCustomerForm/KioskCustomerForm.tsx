import { ScrollView, Text, View } from "react-native"
import { FormField } from "@/components/common/FormField/FormField"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import type { OfferingAttachment } from "@/lib/types"
import type { KioskCheckoutSelection } from "@/lib/kioskCheckout"
import { KioskCheckout } from "../KioskCheckout/KioskCheckout"
import { KioskAgreements } from "../KioskAgreements/KioskAgreements"
import { KioskSignature } from "../KioskSignature/KioskSignature"
import { useKioskCustomerForm } from "./useKioskCustomerForm"

export function KioskCustomerForm({ selection, documents, onBack, review, payment, onDone }: {
  selection: KioskCheckoutSelection; documents: OfferingAttachment[]
  onBack: () => void; review: (url: string) => Promise<void>
  payment: (url: string) => Promise<void>; onDone: () => void
}) {
  const s = useKioskCustomerForm(documents, review)
  if (s.step === "ready") return <KioskCheckout selection={selection} customer={s.customer} documents={documents}
    signature={s.signature} payment={payment} onBack={s.back} onDone={onDone} />
  return <View style={s.styles.frame}>
    <View style={s.styles.stepHeader}>
      <PrimaryButton label="Back" variant="secondary" onPress={s.step === "customer" ? onBack : s.back} />
      <Text style={s.styles.stepLabel}>Booking · {s.step === "customer" ? "Your details" : s.step === "agreements" ? "Agreements" : "Signature"}</Text>
    </View>
    <ScrollView style={s.styles.scroll} contentContainerStyle={s.styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
    {s.step === "customer" ? <>
      <Text style={s.styles.heading} accessibilityRole="header">Your details</Text>
      <FormField label="Full name" value={s.customer.fullName} onChangeText={s.name} autoComplete="off" importantForAutofill="no" autoCorrect={false} />
      <FormField label="Email address" value={s.customer.email} onChangeText={s.email} keyboardType="email-address" autoCapitalize="none" autoComplete="off" importantForAutofill="no" autoCorrect={false} />
      <Text style={s.styles.muted}>Your confirmation and receipt go here.</Text>
      <FormField label="Mobile number (optional)" value={s.customer.phone} onChangeText={s.phone} onBlur={s.phoneBlur} error={s.phoneError}
        keyboardType="phone-pad" autoComplete="off" importantForAutofill="no" autoCorrect={false} />
      <Text style={s.styles.text}>When you book, we will create an account for you if needed so you can view your booking later. By continuing you agree to the Terms of Service and Privacy Policy.</Text>
      {s.legal.map(link => <PrimaryButton key={link.key} label={link.label} onPress={link.onPress} variant="secondary" />)}
      {s.linkError ? <Text style={s.styles.text} accessibilityRole="alert">This page cannot be opened right now. Please see staff.</Text> : null}
    </> : s.step === "agreements" ? <>
      <KioskAgreements vendorId={selection.vendorId} offeringId={selection.offeringId} documents={documents} agreed={s.agreed} toggle={s.toggle} review={review} />
    </> : <KioskSignature signerName={s.customer.fullName.trim()} onConfirm={s.confirmSignature} />}
    </ScrollView>
    {s.step !== "signature" ? <View style={[s.styles.actionBar, { paddingBottom: s.actionBarPaddingBottom }]}>
      <PrimaryButton label="Continue" onPress={s.next} disabled={s.step === "customer" ? !s.valid : !s.allAgreed} />
    </View> : null}
  </View>
}
