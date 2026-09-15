import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from "react-native"
import { FormField } from "@/components/common/FormField/FormField"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { useKioskStaffDialog } from "./useKioskStaffDialog"

export function KioskStaffDialog({ exit, onClose }: { exit: boolean; onClose: () => void }) {
  const s = useKioskStaffDialog(exit, onClose)
  return (
    <Modal transparent animationType="fade" onRequestClose={s.close}>
      <View style={s.styles.backdrop}>
        <KeyboardAvoidingView style={s.styles.keyboard} behavior={Platform.OS === "android" ? "height" : undefined}>
          <View style={s.styles.dialog} accessibilityViewIsModal>
            <ScrollView contentContainerStyle={s.styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
              <Text style={s.styles.title} accessibilityRole="header">{exit ? "Exit kiosk mode" : "Staff sign-in"}</Text>
              {s.needsEmail ? <FormField label="Staff email" value={s.email} onChangeText={s.setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!s.busy} /> : null}
              <FormField label="Staff password" value={s.password} onChangeText={s.setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="off" editable={!s.busy} onSubmitEditing={s.submit} />
              {s.error ? <Text style={s.styles.error} accessibilityRole="alert">{s.error}</Text> : null}
              <PrimaryButton label={exit ? "Verify and exit" : "Sign in"} onPress={s.submit} loading={s.busy} disabled={!s.password || (s.needsEmail && !s.email.trim())} />
              <PrimaryButton label="Cancel" variant="secondary" onPress={s.close} disabled={s.busy} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}
