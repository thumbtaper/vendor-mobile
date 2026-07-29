import { useMemo } from "react"
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native"

import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./RejectReasonSheet.styles"
import { useRejectReasonSheet } from "./useRejectReasonSheet"

interface Props {
  visible: boolean
  bookerName: string
  onConfirm: (reason: string) => Promise<void> | void
  onClose: () => void
}

// A bottom sheet rather than an alert: the reason is typed, and the booker reads
// it. `Modal` is used instead of a sheet library because none is in the approved
// dependency list and this is a single-step form.
export function RejectReasonSheet({
  visible,
  bookerName,
  onConfirm,
  onClose,
}: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useRejectReasonSheet(onConfirm, onClose)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      // Android's hardware back must close the sheet, not the screen behind it.
      onRequestClose={s.cancel}
    >
      <Pressable style={styles.backdrop} onPress={s.cancel} accessibilityRole="button">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Stops a tap inside the sheet from dismissing it. */}
          <Pressable onPress={() => {}} accessible={false}>
            <View style={styles.sheet}>
              <View style={styles.grabber} />
              <Text style={styles.title}>Reject this booking?</Text>
              <Text style={styles.body}>
                {bookerName || "The booker"} will be told the booking was
                rejected, and will see the reason you give here.
              </Text>
              <TextInput
                value={s.reason}
                onChangeText={s.setReason}
                placeholder="Why is this being rejected?"
                placeholderTextColor={tokens.text}
                multiline
                autoFocus
                accessibilityLabel="Reason for rejection"
                style={styles.input}
              />
              <View style={styles.actions}>
                <PrimaryButton
                  label="Reject booking"
                  onPress={s.confirm}
                  loading={s.submitting}
                  disabled={!s.canSubmit}
                  accessibilityHint="Cancels the booking and notifies the booker"
                />
                <PrimaryButton
                  label="Keep it"
                  onPress={s.cancel}
                  variant="secondary"
                />
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}
