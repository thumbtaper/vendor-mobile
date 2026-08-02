import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"

import { fmtPeso, statusLabel } from "@/lib/format"
import type { Booking } from "@/lib/types"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./BookingListItem.styles"

// Pure display, per the plan's §4 note: the row is display only, and the
// approve/reject state lives in the screen hook. Deliberately NOT a port of the
// web's `useBookingRow` — on mobile the actions live on the detail screen and in
// the swipe affordance, not inside a dense table row.
export function BookingListItem({
  booking,
  onPress,
}: {
  booking: Booking
  onPress: (booking: Booking) => void
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const status = tokens.status[booking.status] ?? {
    bg: tokens.pillBg,
    fg: tokens.text,
  }
  const initials = initialsOf(booking.bookerName)
  const meta = [booking.bookedDate, booking.startTime, booking.offeringName]
    .filter(Boolean)
    .join(" · ")

  return (
    <Pressable
      onPress={() => onPress(booking)}
      accessibilityRole="button"
      accessibilityLabel={`${booking.bookerName || "Booking"}, ${statusLabel(booking.status)}`}
      accessibilityHint="Opens the booking to approve or reject it"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.avatar, { backgroundColor: status.bg }]}>
        <Text style={[styles.initials, { color: status.fg }]}>{initials}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {booking.bookerName || "Unnamed booker"}
          </Text>
          {booking.offeringCode ? (
            <Text
              style={[
                styles.code,
                { backgroundColor: status.bg, color: status.fg },
              ]}
            >
              {booking.offeringCode}
            </Text>
          ) : null}
        </View>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>

      <View style={styles.trailing}>
        {/* Status is always text, never colour alone (plan §5.3). */}
        <Text style={[styles.badge, { backgroundColor: status.bg, color: status.fg }]}>
          {statusLabel(booking.status)}
        </Text>
        <Text style={styles.price}>{fmtPeso(booking.pricePaid, 0)}</Text>
      </View>
    </Pressable>
  )
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2)
  if (parts.length === 0) return "?"
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("")
}
