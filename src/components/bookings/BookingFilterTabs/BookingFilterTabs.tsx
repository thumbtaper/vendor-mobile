import { LinearGradient } from "expo-linear-gradient"
import { useMemo } from "react"
import { Pressable, ScrollView, Text } from "react-native"

import type { BookingFilter } from "@/hooks/useBookingsQuery"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./BookingFilterTabs.styles"

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
            <Text style={[styles.label, active && styles.labelActive]}>
              {filter.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
