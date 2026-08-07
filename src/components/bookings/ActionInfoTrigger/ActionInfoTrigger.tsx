import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./ActionInfoTrigger.styles"

interface Props {
  onPress: () => void
}

/**
 * The "i" that opens `ActionInfoSheet`.
 *
 * Its own component because the action bar renders it from two branches — the
 * `pending` one and the fulfilment one — and because the alternative was
 * `BookingActionBar` importing a second component's stylesheet to draw it, which
 * it did until I1.
 *
 * Pure display: no state, no handlers of its own, so no companion hook. What the
 * sheet says is decided by `useBookingActionBar`.
 */
export function ActionInfoTrigger({ onPress }: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="What do these actions do?"
      accessibilityHint="Opens a short explanation of each action on this screen"
      style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
    >
      <View style={styles.mark}>
        {/* Capped, unlike every other label in the bar. The mark is a FIXED 28pt
            circle rather than a `minHeight`-floored control, so scaled text
            overflows it instead of growing it — the one case `tokens.ts` names
            for a cap. Nothing is lost: the glyph is decoration, and the meaning
            is in the accessibilityLabel above. */}
        <Text style={styles.glyph} maxFontSizeMultiplier={1.4}>
          i
        </Text>
      </View>
    </Pressable>
  )
}
