import { useMemo } from "react"
import { Modal, Pressable, Text, View } from "react-native"

import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import type { BookingActionCopy } from "@/lib/bookingActionCopy"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./ActionInfoSheet.styles"

interface Props {
  visible: boolean
  /** The action being explained. Null renders nothing. */
  copy: BookingActionCopy | null
  onClose: () => void
}

/**
 * Explains what a booking action does — specifically, what it does to the
 * vendor's money.
 *
 * D1 chose a bottom sheet. The web portal uses a hover popover, which has no
 * phone equivalent; an inline expanding caption was rejected because it reflows
 * the action bar at the bottom of the screen, where reflow is most disorienting.
 *
 * The body is the `meaning` string from `bookingActionCopy.ts` VERBATIM — that
 * table exists so the button, this sheet and the web portal cannot drift apart on
 * the wording that tells someone when they get paid.
 *
 * Pure display: it holds no state, so it has no companion hook. Visibility is
 * owned by `useBookingActionBar`.
 */
export function ActionInfoSheet({ visible, copy, onClose }: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  if (!copy) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      // Android's hardware back must close the sheet, not the screen behind it.
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        {/* Stops a tap inside the sheet from dismissing it. */}
        <Pressable onPress={() => {}} accessible={false}>
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <Text style={styles.title}>{copy.label}</Text>
            <Text style={styles.body}>{copy.meaning}</Text>
            {/* An explicit button, not swipe-to-dismiss only: a gesture may be a
                shortcut but never the only way out (mobile-dev §2). */}
            <PrimaryButton label="Got it" onPress={onClose} variant="secondary" />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
