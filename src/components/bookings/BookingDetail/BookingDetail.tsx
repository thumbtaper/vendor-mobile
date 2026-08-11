import { useMemo } from "react"
import { ActivityIndicator, ScrollView, Text, View } from "react-native"

import { BookingActionBar } from "@/components/bookings/BookingActionBar/BookingActionBar"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { ScreenTitle } from "@/components/common/ScreenTitle/ScreenTitle"
import { bookingDayCount, fmtBookingSpan, fmtPeso, statusLabel } from "@/lib/format"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./BookingDetail.styles"
import { useBookingDetail } from "./useBookingDetail"

export function BookingDetail() {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useBookingDetail()

  if (s.isLoading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator color={tokens.text} />
      </View>
    )
  }

  if (s.isError || !s.booking) {
    return (
      <View style={styles.centred}>
        <Text style={styles.headline}>Couldn&apos;t load this booking</Text>
        <Text style={styles.message}>
          It may have been removed, or the connection dropped.
        </Text>
        <PrimaryButton label="Back to bookings" onPress={s.goBack} />
      </View>
    )
  }

  const b = s.booking
  // Inclusive day count for a multi-day booking; 0 for time-granular ones.
  const days = bookingDayCount(b)
  const status = tokens.status[b.status] ?? { bg: tokens.pillBg, fg: tokens.text }
  const contact = [b.bookerEmail, b.bookerPhone].filter(Boolean).join(" · ")

  return (
    <View style={[styles.wrapper, { paddingBottom: s.bottomInset }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* B1 — this screen passes no header action, so `ScreenShell` pins
            nothing. Without this the "Booking" title would not render at all,
            because the title now lives wherever the screen puts it rather than in
            a fixed header. */}
        <ScreenTitle />

        <View style={styles.card}>
          <Text
            style={[styles.badge, { backgroundColor: status.bg, color: status.fg }]}
          >
            {statusLabel(b.status)}
          </Text>
          <Text style={styles.headline}>{b.bookerName || "Unnamed booker"}</Text>
          {contact ? <Text style={styles.value}>{contact}</Text> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Offering</Text>
            <Text style={styles.value}>
              {b.offeringName || "—"}
              {b.offeringCode ? ` (${b.offeringCode})` : ""}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{b.startTime ? "Date & time" : "Dates"}</Text>
            <Text style={styles.value}>
              {[b.startTime ? b.bookedDate : "", fmtBookingSpan(b)].filter(Boolean).join(" · ") || "—"}
              {days > 1 ? ` (${days} days)` : ""}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Paid</Text>
            <Text style={styles.price}>{fmtPeso(b.pricePaid)}</Text>
          </View>
          {b.notes ? (
            <View style={styles.field}>
              <Text style={styles.label}>Notes from the booker</Text>
              <Text style={styles.value}>{b.notes}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <BookingActionBar
        booking={b}
        onApprove={s.approve}
        onReject={s.reject}
        onFulfil={s.fulfil}
        onFlag={s.flag}
      />
    </View>
  )
}
