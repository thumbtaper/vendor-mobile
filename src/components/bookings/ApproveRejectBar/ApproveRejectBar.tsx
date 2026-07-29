import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"

import { RejectReasonSheet } from "@/components/bookings/RejectReasonSheet/RejectReasonSheet"
import type { Booking } from "@/lib/types"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./ApproveRejectBar.styles"
import { useApproveRejectBar } from "./useApproveRejectBar"

interface Props {
  booking: Booking
  onApprove: (booking: Booking) => void
  onReject: (booking: Booking, reason: string) => Promise<void>
}

export function ApproveRejectBar({ booking, onApprove, onReject }: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useApproveRejectBar(booking, onApprove, onReject)

  // Only `pending` can be approved or rejected — the DB trigger enforces the
  // same rule, so offering the buttons for any other status would be inviting a
  // guaranteed failure.
  if (booking.status !== "pending") {
    return (
      <View style={styles.resolved}>
        <Text style={styles.resolvedText}>
          {booking.status === "cancelled" && booking.rejectionReason
            ? `Rejected — ${booking.rejectionReason}`
            : `This booking is ${booking.status}. No action needed.`}
        </Text>
      </View>
    )
  }

  return (
    <>
      <View style={styles.bar}>
        <Pressable
          onPress={s.approve}
          accessibilityRole="button"
          accessibilityLabel="Approve booking"
          accessibilityHint="Confirms the booking. You can undo for a few seconds."
          style={({ pressed }) => [
            styles.button,
            styles.approve,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.approveLabel}>Approve</Text>
        </Pressable>

        <Pressable
          onPress={s.openSheet}
          accessibilityRole="button"
          accessibilityLabel="Reject booking"
          accessibilityHint="Asks for a reason, then cancels the booking"
          style={({ pressed }) => [
            styles.button,
            styles.reject,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.rejectLabel}>Reject</Text>
        </Pressable>
      </View>

      <RejectReasonSheet
        visible={s.sheetOpen}
        bookerName={booking.bookerName}
        onConfirm={s.confirmReject}
        onClose={s.closeSheet}
      />
    </>
  )
}
