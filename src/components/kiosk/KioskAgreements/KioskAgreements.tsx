import { Square, SquareCheck } from "lucide-react-native"
import { ActivityIndicator, Pressable, Text, View } from "react-native"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import type { OfferingAttachment } from "@/lib/types"
import { useKioskAgreements } from "./useKioskAgreements"

export function KioskAgreements({ vendorId, offeringId, documents, agreed, toggle, review }: {
  vendorId: string; offeringId: string; documents: OfferingAttachment[]; agreed: Set<string>
  toggle: (id: string) => void; review: (url: string) => Promise<void>
}) {
  const s = useKioskAgreements(vendorId, offeringId, documents, agreed, toggle, review)
  return <View style={s.styles.content}>
    <Text style={s.styles.heading} accessibilityRole="header">Review and agree</Text>
    {s.documents.map(d => <View key={d.id} style={s.styles.document}>
      <Text style={s.styles.heading}>{d.title}</Text>
      {d.body ? <Text style={s.styles.text}>{d.body}</Text> : null}
      {d.requiresSignature ? <Text style={s.styles.muted}>Signature required</Text> : null}
      {d.storagePath ? <>
        {d.linkReady ? <PrimaryButton label="Open document" onPress={d.open} variant="secondary" disabled={s.opening} />
          : !d.failed ? <ActivityIndicator accessibilityLabel="Preparing document" /> : null}
        {d.failed ? <>
          <Text style={s.styles.text} accessibilityRole="alert">This document cannot be opened right now. Please ask a staff member.</Text>
          <PrimaryButton label="Try again" onPress={s.retry} variant="secondary" />
        </> : null}
      </> : null}
      <Pressable style={s.styles.check} onPress={d.toggle} accessibilityRole="checkbox" accessibilityState={{ checked: d.checked }} accessibilityLabel={`I have read and agree: ${d.title}`}>
        {d.checked ? <SquareCheck color={s.tokens.accent} size={24} /> : <Square color={s.tokens.text} size={24} />}
        <Text style={s.styles.text}>I have read and agree</Text>
      </Pressable>
    </View>)}
  </View>
}
