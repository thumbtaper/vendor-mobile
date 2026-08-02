import { LinearGradient } from "expo-linear-gradient"
import { useMemo } from "react"
import { Pressable, ScrollView, Text } from "react-native"

import { BOOKING_FILTERS } from "@/lib/bookingFilters"
import type { FilterCounts } from "@/hooks/useBookingFilterCounts"
import type { BookingFilter } from "@/hooks/useBookingsQuery"
import { useAppTheme } from "@/theme/useAppTheme"
import { CHIP_HIT_SLOP, makeStyles } from "./BookingFilterTabs.styles"

// Pure display — fully controlled by the screen hook.
//
// The chip list is no longer declared here: it comes from `lib/bookingFilters.ts`,
// which is the port of the web portal's `BOOKING_FILTERS`. A local copy would be
// the exact drift that file's comment warns about, and the order shown ("All"
// first, then by urgency) is part of the shared definition.
//
// Six chips now instead of five, so the strip scrolls on a narrow phone. That is
// fine and already handled — the ScrollView's `flexGrow: 0` (see the styles file)
// is what keeps it sized to its content.
export function BookingFilterTabs({
  value,
  onChange,
  counts,
}: {
  value: BookingFilter
  onChange: (next: BookingFilter) => void
  counts?: FilterCounts
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
      {BOOKING_FILTERS.map((filter) => {
        const active = filter.key === value
        // Zero is not rendered: an empty badge is visual noise, and "0 need you"
        // is worse than nothing — it draws the eye to reassure about a state the
        // absence of a badge already communicates.
        const badge = counts?.[filter.key]
        const showBadge = typeof badge === "number" && badge > 0
        return (
          <Pressable
            key={filter.key}
            onPress={() => onChange(filter.key)}
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
            {showBadge ? (
              <Text
                style={[styles.badge, active && styles.badgeActive]}
                maxFontSizeMultiplier={1.3}
                // Read as part of the chip, not as a stray number.
                accessibilityLabel={`${badge} ${filter.label}`}
              >
                {badge > 99 ? "99+" : badge}
              </Text>
            ) : null}
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
