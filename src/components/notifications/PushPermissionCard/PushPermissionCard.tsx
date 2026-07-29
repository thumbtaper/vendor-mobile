import { useMemo } from "react"
import { Linking, Text, View } from "react-native"

import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import type { PushState } from "@/hooks/usePushRegistration"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./PushPermissionCard.styles"

// In-context permission prompt: it sits on the Alerts screen, where the vendor is
// already thinking about notifications, rather than firing on first launch. A
// cold prompt is the fastest route to a permanent "Don't allow", which iOS will
// not let the app ask about again.
export function PushPermissionCard({
  state,
  onEnable,
}: {
  state: PushState
  onEnable: () => void
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  if (state === "granted" || state === "checking") return null

  if (state === "unsupported") {
    // Silent on simulators — this is a developer condition, not something to
    // explain to a vendor.
    return null
  }

  if (state === "unavailable") {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Push notifications aren&apos;t ready yet</Text>
        <Text style={styles.body}>
          Your device is set up, but the server isn&apos;t accepting registrations
          yet. Alerts still arrive while the app is open.
        </Text>
      </View>
    )
  }

  if (state === "denied") {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Notifications are turned off</Text>
        <Text style={styles.body}>
          You won&apos;t be told about new bookings unless the app is open. Turn
          them back on in your device settings.
        </Text>
        <View style={styles.action}>
          <PrimaryButton
            label="Open settings"
            onPress={() => Linking.openSettings()}
            variant="secondary"
          />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Get told about new bookings</Text>
      <Text style={styles.body}>
        Turn on notifications and we&apos;ll alert you the moment a booking needs
        approving — even when the app is closed.
      </Text>
      <View style={styles.action}>
        <PrimaryButton label="Turn on notifications" onPress={onEnable} />
      </View>
    </View>
  )
}
