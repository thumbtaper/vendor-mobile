import { ActivityIndicator, Modal, ScrollView, Text, View } from "react-native"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { useKioskLauncher } from "./useKioskLauncher"

export function KioskLauncher({ vendorId, onClose }: { vendorId: string; onClose: () => void }) {
  const s = useKioskLauncher(vendorId, onClose)
  return (
    <Modal transparent animationType="fade" onRequestClose={s.close}>
      <View style={s.styles.backdrop}>
        <View style={s.styles.dialog} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={s.styles.content}>
            <Text style={s.styles.title} accessibilityRole="header">Start kiosk mode?</Text>
            {s.loading ? <ActivityIndicator accessibilityLabel="Checking kiosk availability" /> : null}
            {s.summary ? <>
              <Text style={s.styles.title}>{s.summary.vendorName}</Text>
              <Text style={s.styles.text}>{s.eligibleCount} eligible offerings</Text>
              {s.excluded.map(offering => (
                <Text key={offering.id} style={s.styles.text}>{offering.name}: {offering.reason}</Text>
              ))}
              <Text style={s.styles.text}>Kiosk mode does not lock this device. Use Android screen pinning or iOS Guided Access before handing it to a customer.</Text>
            </> : null}
            {s.error ? <Text style={s.styles.error} accessibilityRole="alert">{s.error}</Text> : null}
            {!s.loading && !s.summary ? <PrimaryButton label="Retry" onPress={s.retry} /> : null}
            <PrimaryButton label="Start kiosk" onPress={s.start} loading={s.starting} disabled={!s.summary || s.loading} />
            <PrimaryButton label="Cancel" variant="secondary" onPress={s.close} disabled={s.starting} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
