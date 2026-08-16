import { useMemo } from "react"
import { Modal, Pressable, ScrollView, Text, View } from "react-native"

import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import type { BookingActionCopy } from "@/lib/bookingActionCopy"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./ActionInfoSheet.styles"
import { useActionInfoSheet } from "./useActionInfoSheet"

interface Props {
  visible: boolean
  /**
   * Every action the bar is currently offering, in the order it renders them.
   * Supplied by `useBookingActionBar` from the same values the bar branches on —
   * never rebuilt here, or the sheet could describe a button that isn't on screen.
   */
  actions: readonly BookingActionCopy[]
  onClose: () => void
}

/**
 * Explains what the booking actions do — specifically, what they do to the
 * vendor's money.
 *
 * D1 chose a bottom sheet. The web portal uses a hover popover, which has no
 * phone equivalent; an inline expanding caption was rejected because it reflows
 * the action bar at the bottom of the screen, where reflow is most disorienting.
 *
 * D2 then made it one sheet per BAR rather than one per action. The bar had
 * grown a per-action trigger that only ever appeared beside the fulfilment
 * button, so Approve, Reject, Undo and Flag had no sighted explanation at all —
 * and adding a trigger to each would have put up to four extra 44pt controls in
 * a row that was already too heavy.
 *
 * Each body is the `meaning` string from `bookingActionCopy.ts` VERBATIM — that
 * table exists so the button, this sheet and the web portal cannot drift apart on
 * the wording that tells someone when they get paid.
 *
 * Pure display: it holds no state, so it has no companion hook. Visibility is
 * owned by `useBookingActionBar`.
 */
export function ActionInfoSheet({ visible, actions, onClose }: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useActionInfoSheet()

  if (actions.length === 0) return null

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
        {/* Stops a tap inside the sheet from dismissing it. Also carries the
            height bound — see `sheetWrap` in the stylesheet for why it has to be
            this element and not the sheet itself. */}
        <Pressable
          style={styles.sheetWrap}
          onPress={() => {}}
          accessible={false}
        >
          {/* Bottom inset applied inline because it is a runtime value — the one
              case the render layer may carry a style object (B1). It sits on the
              sheet rather than on `sheetWrap` so the `maxHeight: "70%"` bound
              above still measures the same box: growing the WRAP would let the
              sheet exceed 70% of the screen by the size of the inset. */}
          <View style={[styles.sheet, { paddingBottom: s.bottomInset }]}>
            <View style={styles.grabber} />
            <Text style={styles.title}>What these do</Text>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
            >
              {actions.map((action) => (
                <View key={action.key} style={styles.entry}>
                  <Text style={styles.entryLabel}>{action.label}</Text>
                  <Text style={styles.body}>{action.meaning}</Text>
                </View>
              ))}
            </ScrollView>

            {/* An explicit button, not swipe-to-dismiss only: a gesture may be a
                shortcut but never the only way out (mobile-dev §2). */}
            <PrimaryButton label="Got it" onPress={onClose} variant="secondary" />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
