import { ActivityIndicator, ScrollView, Text, View } from "react-native"
import { FormField } from "@/components/common/FormField/FormField"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { useKioskCloseOut } from "./useKioskCloseOut"

export function KioskCloseOut({ vendorId, onHome }: { vendorId: string; onHome: () => void }) {
  const s = useKioskCloseOut(vendorId, onHome)
  return <View style={s.styles.frame}>
    <View style={s.styles.stepHeader}>
      <PrimaryButton label="Back to welcome" variant="secondary" onPress={s.home} />
      <Text style={s.styles.stepLabel}>Finish a booking</Text>
    </View>
    <ScrollView style={s.styles.scroll} contentContainerStyle={s.styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Text style={s.styles.heading} accessibilityRole="header">Finish a booking</Text>
      <Text style={s.styles.text}>Enter your mobile number or booking reference. We only show bookings matching what you enter.</Text>
      <FormField label="Mobile number or booking reference" value={s.identifier} onChangeText={s.setIdentifier}
        placeholder="e.g. 0917 123 4567" keyboardType="default" autoCapitalize="none" autoCorrect={false}
        autoComplete="off" importantForAutofill="no" editable={!s.searching && !s.confirmingId}
        onSubmitEditing={() => void s.search()} />
      <PrimaryButton label="Find booking" onPress={() => void s.search()} loading={s.searching}
        disabled={s.identifier.trim().length < 4 || Boolean(s.confirmingId)} />
      {s.error ? <Text style={s.styles.error} accessibilityRole="alert">{s.error}</Text> : null}
      {s.doneMessage ? <Text style={s.styles.done} accessibilityLiveRegion="polite">{s.doneMessage}</Text> : null}
      {s.searched && !s.searching && s.items.length === 0 && !s.doneMessage ? <Text style={s.styles.muted}>We couldn&apos;t find a booking for that number or reference. Please check it, or see the front desk.</Text> : null}
      {s.items.map(item => <View key={item.id} style={s.styles.match}>
        <View style={s.styles.matchMeta}>
          <Text style={s.styles.matchName}>{item.offeringName}</Text>
          {item.action ? <Text style={s.styles.statusTag}>{item.action.sub}</Text> : null}
          {item.when ? <Text style={s.styles.matchSub}>{item.when}</Text> : null}
          {item.message ? <Text style={s.styles.matchMessage}>{item.message}</Text> : null}
        </View>
        {item.action ? <PrimaryButton label={item.action.label} onPress={() => void s.confirm(item.id)} loading={s.confirmingId === item.id} disabled={Boolean(s.confirmingId && s.confirmingId !== item.id)} /> : null}
      </View>)}
      {s.searching ? <ActivityIndicator accessibilityLabel="Looking up booking" /> : null}
      <Text style={s.styles.muted}>Hand anything you borrowed to the front desk first, then confirm here. Staff will do the rest.</Text>
    </ScrollView>
    <View style={[s.styles.actionBar, { paddingBottom: s.actionBarPaddingBottom }]}>
      <PrimaryButton label="Return to welcome" variant="secondary" onPress={s.home} disabled={s.searching || Boolean(s.confirmingId)} />
    </View>
  </View>
}
