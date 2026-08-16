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
  /** Defaults describe the REJECT case; the flag case overrides all of them. */
  title?: string
  body?: string
  placeholder?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmHint?: string
  /** Minimum trimmed length. `raise_booking_dispute` enforces 10 server-side. */
  minLength?: number
}

// A bottom sheet rather than an alert: the reason is typed, and the booker reads
// it. `Modal` is used instead of a sheet library because none is in the approved
// dependency list and this is a single-step form.
//
// Serves TWO callers: rejecting a pending booking, and flagging one for Ezzy to
// review (I9). Both collect a free-text reason behind a confirm step, so this is
// parameterised rather than cloned — every prop defaults to the reject wording, so
// the original call site is unchanged.
export function RejectReasonSheet({
  visible,
  bookerName,
  onConfirm,
  onClose,
  title,
  body,
  placeholder,
  confirmLabel,
  cancelLabel,
  confirmHint,
  minLength,
}: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useRejectReasonSheet(onConfirm, onClose, minLength)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      // Android's hardware back must close the sheet, not the screen behind it.
      onRequestClose={s.cancel}
    >
      <Pressable style={styles.backdrop} onPress={s.cancel} accessibilityRole="button">
        {/* ⚠️ Android gets "height", NOT `undefined`.
            `behavior={undefined}` makes this component do NOTHING — the exact
            defect `AuthScreen` shipped with for months. It looks defensible
            because `app.json` sets `softwareKeyboardLayoutMode: "resize"`, but
            that was ALREADY the default when the sign-in keyboard was drawing
            over the password field, and the user confirmed on a device that
            `behavior="height"` was what fixed it
            (`.plans/2026-08-02-vendor-mobile-keyboard-and-version.md` B1).
            "height" works whether or not the window itself resizes.

            iOS keeps "padding" rather than `AuthScreen`'s
            `automaticallyAdjustKeyboardInsets`: that prop belongs to a ScrollView,
            and this sheet has none. One mechanism per platform — do not add the
            second to either, which double-compensates. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Stops a tap inside the sheet from dismissing it. */}
          <Pressable onPress={() => {}} accessible={false}>
            {/* Bottom inset applied inline because it is a runtime value — the
                one case the render layer may carry a style object (B1). */}
            <View style={[styles.sheet, { paddingBottom: s.bottomInset }]}>
              <View style={styles.grabber} />
              <Text style={styles.title}>
                {title ?? "Reject this booking?"}
              </Text>
              <Text style={styles.body}>
                {body ??
                  `${bookerName || "The booker"} will be told the booking was rejected, and will see the reason you give here.`}
              </Text>
              <TextInput
                value={s.reason}
                onChangeText={s.setReason}
                placeholder={placeholder ?? "Why is this being rejected?"}
                placeholderTextColor={tokens.text}
                multiline
                autoFocus
                accessibilityLabel="Reason for rejection"
                style={styles.input}
              />
              <View style={styles.actions}>
                <PrimaryButton
                  label={confirmLabel ?? "Reject booking"}
                  onPress={s.confirm}
                  loading={s.submitting}
                  disabled={!s.canSubmit}
                  accessibilityHint={
                    confirmHint ?? "Cancels the booking and notifies the booker"
                  }
                />
                <PrimaryButton
                  label={cancelLabel ?? "Keep it"}
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
