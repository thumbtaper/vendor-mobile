import { Text, View } from "react-native"
import { FormField } from "@/components/common/FormField/FormField"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import type { OfferingAttachment } from "@/lib/types"
import { KioskAgreements } from "../KioskAgreements/KioskAgreements"
import { useKioskCustomerForm } from "./useKioskCustomerForm"

export function KioskCustomerForm({ vendorId, offeringId, documents, onBack, review }: {
  vendorId: string; offeringId: string; documents: OfferingAttachment[]
  onBack: () => void; review: (url: string) => Promise<void>
}) {
  const s = useKioskCustomerForm(documents, review)
  return <View style={s.styles.content}>
    <PrimaryButton label="Back" variant="secondary" onPress={s.step === "customer" ? onBack : s.back} />
    {s.step === "customer" ? <>
      <Text style={s.styles.muted}>Step 3: Customer details</Text>
      <Text style={s.styles.heading} accessibilityRole="header">Your details</Text>
      <FormField label="Full name" value={s.customer.fullName} onChangeText={s.name} autoComplete="off" importantForAutofill="no" autoCorrect={false} />
      <FormField label="Email address" value={s.customer.email} onChangeText={s.email} keyboardType="email-address" autoCapitalize="none" autoComplete="off" importantForAutofill="no" autoCorrect={false} />
      <Text style={s.styles.muted}>Your confirmation and receipt go here.</Text>
      <FormField label="Mobile number (optional)" value={s.customer.phone} onChangeText={s.phone} onBlur={s.phoneBlur} error={s.phoneError}
        keyboardType="phone-pad" autoComplete="off" importantForAutofill="no" autoCorrect={false} />
      <Text style={s.styles.text}>When you book, we will create an account for you if needed so you can view your booking later. By continuing you agree to the Terms of Service and Privacy Policy.</Text>
      {s.legal.map(link => <PrimaryButton key={link.key} label={link.label} onPress={link.onPress} variant="secondary" />)}
      {s.linkError ? <Text style={s.styles.text} accessibilityRole="alert">This page cannot be opened right now. Please see staff.</Text> : null}
      <PrimaryButton label="Continue" onPress={s.next} disabled={!s.valid} />
    </> : s.step === "agreements" ? <>
      <Text style={s.styles.muted}>Step 4: Agreements</Text>
      <KioskAgreements vendorId={vendorId} offeringId={offeringId} documents={documents} agreed={s.agreed} toggle={s.toggle} review={review} />
      <PrimaryButton label="Continue" onPress={s.next} disabled={!s.allAgreed} />
    </> : <>
      <Text style={s.styles.heading} accessibilityRole="header">Please see staff</Text>
      <Text style={s.styles.text}>{s.requirements.needsSignature ? "A signature is required to finish this booking." : "Please see staff to finish your booking."} No booking or payment has been made.</Text>
    </>}
  </View>
}
