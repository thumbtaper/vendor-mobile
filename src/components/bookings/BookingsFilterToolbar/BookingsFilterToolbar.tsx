import { CalendarDays, ChevronDown, ListFilter } from "lucide-react-native"
import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"

import { FilterOptionSheet } from "@/components/common/FilterOptionSheet/FilterOptionSheet"
import { useAppTheme } from "@/theme/useAppTheme"
import type { UseBookingsFilterToolbarInput } from "./useBookingsFilterToolbar"
import { useBookingsFilterToolbar } from "./useBookingsFilterToolbar"
import { makeStyles } from "./BookingsFilterToolbar.styles"

export function BookingsFilterToolbar(props: UseBookingsFilterToolbarInput) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useBookingsFilterToolbar(props)

  return (
    <>
      <View style={styles.toolbar}>
        <Pressable
          onPress={s.openStatus}
          accessibilityRole="button"
          accessibilityLabel={`Booking status filter, ${s.statusLabel}`}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.iconWrap}>
            <ListFilter size={16} color={tokens.accent} />
          </View>
          <View style={styles.buttonText}>
            <Text style={styles.eyebrow}>Status</Text>
            <View style={styles.valueRow}>
              <Text
                style={styles.value}
                numberOfLines={1}
              >
                {s.statusLabel}
              </Text>
              {s.statusBadge && s.statusBadge > 0 ? (
                <Text
                  style={styles.badge}
                  accessibilityLabel={`${s.statusBadge} ${s.statusLabel}`}
                >
                  {s.statusBadge > 99 ? "99+" : s.statusBadge}
                </Text>
              ) : null}
            </View>
          </View>
          <ChevronDown size={16} color={tokens.text} />
        </Pressable>

        <Pressable
          onPress={s.openDates}
          accessibilityRole="button"
          accessibilityLabel={`Booking date filter, ${s.dateLabel}`}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.iconWrap}>
            <CalendarDays size={16} color={tokens.accent} />
          </View>
          <View style={styles.buttonText}>
            <Text style={styles.eyebrow}>Dates</Text>
            <Text
              style={styles.value}
              numberOfLines={1}
            >
              {s.dateLabel}
            </Text>
          </View>
          <ChevronDown size={16} color={tokens.text} />
        </Pressable>
      </View>

      <FilterOptionSheet
        visible={s.activeSheet === "status"}
        title="Booking status"
        subtitle="Choose the work group to show. Badges mark work waiting on you."
        options={s.statusOptions}
        onClose={s.closeSheet}
      />
      <FilterOptionSheet
        visible={s.activeSheet === "dates"}
        title="Booking dates"
        subtitle="Choose when the booking is for. All dates returns to the full list."
        options={s.dateOptions}
        onClose={s.closeSheet}
      />
    </>
  )
}
