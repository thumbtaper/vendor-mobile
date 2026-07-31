import { LinearGradient } from "expo-linear-gradient"
import { useMemo } from "react"
import { Pressable, ScrollView, Text } from "react-native"

import type { BookingFilter } from "@/hooks/useBookingsQuery"
import { useAppTheme } from "@/theme/useAppTheme"
import { CHIP_HIT_SLOP, makeStyles } from "./BookingFilterTabs.styles"

const FILTERS: { value: BookingFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
]

// Pure display — fully controlled by the screen hook. Pending leads because it
// is the only filter with work attached to it.
export function BookingFilterTabs({
  value,
  onChange,
}: {
  value: BookingFilter
  onChange: (next: BookingFilter) => void
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // `style` and `contentContainerStyle` are both required here and do
      // different jobs — see the comments in the styles file. Without `style`,
      // RN's `flexGrow: 1` base style stretches the whole strip.
      style={styles.container}
      contentContainerStyle={styles.scroll}
    >
      {FILTERS.map((filter) => {
        const active = filter.value === value
        return (
          <Pressable
            key={filter.value}
            onPress={() => onChange(filter.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            hitSlop={CHIP_HIT_SLOP}
            style={[styles.chip, active && styles.chipActive]}
          >
            {active ? (
              <LinearGradient
                colors={tokens.navActive.colors}
                start={tokens.navActive.start}
                end={tokens.navActive.end}
                style={styles.gradient}
              />
            ) : null}
            {/* Capped because this chip is sized by padding, not a `minHeight`
                floor: above ~1.5x OS font scale an uncapped label would make the
                chip TALLER than the 36pt version it replaced. 12 x 1.3 = 16pt
                stays legible, and the row scrolls horizontally so nothing clips.
                See `.plans/2026-07-31-vendor-mobile-filter-density.md` D1. */}
            <Text
              style={[styles.label, active && styles.labelActive]}
              maxFontSizeMultiplier={1.3}
            >
              {filter.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
