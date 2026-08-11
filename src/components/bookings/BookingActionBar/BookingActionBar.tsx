import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"

import { ActionInfoSheet } from "@/components/bookings/ActionInfoSheet/ActionInfoSheet"
import { ActionInfoTrigger } from "@/components/bookings/ActionInfoTrigger/ActionInfoTrigger"
import { RejectReasonSheet } from "@/components/bookings/RejectReasonSheet/RejectReasonSheet"
import type { FulfilAction } from "@/hooks/useBookingActions"
import { statusLabel } from "@/lib/format"
import type { Booking } from "@/lib/types"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./BookingActionBar.styles"
import { useBookingActionBar } from "./useBookingActionBar"

interface Props {
  booking: Booking
  onApprove: (booking: Booking) => void
  onReject: (booking: Booking, reason: string) => Promise<void>
  onFulfil: (booking: Booking, action: FulfilAction) => Promise<void>
  onFlag: (booking: Booking, reason: string) => Promise<void>
}

/**
 * The actions available on a booking, for whatever state it is in.
 *
 * Was `ApproveRejectBar`, which handled only `pending` and told the vendor "no
 * action needed" for everything else — false for the three fulfilment states,
 * where the vendor is precisely the one who must act.
 *
 * Pure render layer: every decision lives in `useBookingActionBar`.
 */
export function BookingActionBar({
  booking,
  onApprove,
  onReject,
  onFulfil,
  onFlag,
}: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useBookingActionBar(booking, onApprove, onReject, onFulfil, onFlag)

  // ── pending: approve or reject ────────────────────────────────────────────
  // Approve's 4-second deferred commit and the reason sheet still run through the
  // same props. What changed in B2 is that this branch finally has an "i" — it is
  // the commonest screen in the app and had no sighted explanation of either
  // button until then.
  if (booking.status === "pending") {
    return (
      <>
        {/* Standalone — no wrapping container, so this keeps its own divider. */}
        <View style={styles.bar}>
          <Pressable
            onPress={s.approve}
            accessibilityRole="button"
            accessibilityLabel="Approve booking"
            // I2 — from the copy table, not a literal. Every other button in this
            // file already did this; these two held a second copy of sentences
            // that also live in `bookingActionCopy.ts`, which is precisely the
            // drift that table exists to prevent.
            accessibilityHint={s.approveCopy.meaning}
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
            accessibilityHint={s.rejectCopy.meaning}
            style={({ pressed }) => [
              styles.button,
              styles.reject,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.rejectLabel}>Reject</Text>
          </Pressable>

          <ActionInfoTrigger onPress={s.openInfo} />
        </View>

        <ActionInfoSheet
          visible={s.infoOpen}
          actions={s.visibleActions}
          onClose={s.closeInfo}
        />

        <RejectReasonSheet
          visible={s.sheetOpen}
          bookerName={booking.bookerName}
          onConfirm={s.confirmReject}
          onClose={s.closeSheet}
        />
      </>
    )
  }

  // ── anything the vendor can still act on ──────────────────────────────────
  // `flagCopy` is part of the condition because `completed` is flaggable: a
  // problem can surface after the fact, and flagging reverses the payout release.
  // Without it, completed bookings would fall through to the dead-end branch and
  // a vendor whose customer returned a damaged item would have no recourse on
  // their phone.
  if (s.fulfilCopy || s.undoCopy || s.flagCopy) {
    // The unpaid confirm replaces the bar rather than stacking on top of it, so
    // there is exactly one question on screen and no way to tap the original
    // button while being asked about it.
    if (s.confirmUnpaid && s.fulfilCopy) {
      return (
        <View style={styles.confirm}>
          <Text style={styles.confirmTitle}>
            {s.fulfilCopy.label} without payment?
          </Text>
          <Text style={styles.confirmBody}>
            {booking.bookerName || "This customer"} hasn&rsquo;t paid for this
            booking. If you go ahead there&rsquo;s no payment on record, and no
            payout will be released to you for it.
          </Text>
          <View style={[styles.bar, styles.barInStack]}>
            <Pressable
              onPress={s.cancelUnpaidFulfil}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={({ pressed }) => [
                styles.button,
                styles.ghost,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.ghostLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={s.confirmUnpaidFulfil}
              accessibilityRole="button"
              accessibilityLabel={`${s.fulfilCopy.label} anyway`}
              style={({ pressed }) => [
                styles.button,
                styles.primary,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryLabel}>
                {s.fulfilCopy.label} anyway
              </Text>
            </Pressable>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.stack}>
        {/* I6 — only where the database actually runs a timer. `in_progress`
            renders nothing here, because nothing will auto-confirm it. */}
        {s.autoConfirm.daysLeft !== null ? (
          <Text style={styles.timer}>
            {s.autoConfirm.waitingForServiceDate
              ? `Auto-confirms after the booking date — about ${s.autoConfirm.daysLeft} ${s.autoConfirm.daysLeft === 1 ? "day" : "days"} away.`
              : s.autoConfirm.daysLeft === 0
                ? "Auto-confirming shortly."
                : `Auto-confirms in ${s.autoConfirm.daysLeft} ${s.autoConfirm.daysLeft === 1 ? "day" : "days"} if nobody acts.`}
          </Text>
        ) : null}

        {/* I5 — surfaced on every fulfilment state, not just the gated ones. */}
        {s.unpaidWarning ? (
          <Text style={styles.unpaid}>
            Not paid yet — no payout will be recorded for this booking.
          </Text>
        ) : null}

        {/* Nothing to advance — but still flaggable. Says where the booking is,
            so the flag button does not float without context. */}
        {!s.fulfilCopy && !s.undoCopy ? (
          <Text style={styles.resolvedText}>
            {`This booking is ${statusLabel(booking.status).toLowerCase()}. Flag it if something went wrong.`}
          </Text>
        ) : null}

        <View style={[styles.bar, styles.barInStack]}>
          {s.fulfilCopy ? (
            <Pressable
              onPress={s.doFulfil}
              disabled={s.working}
              accessibilityRole="button"
              accessibilityLabel={s.fulfilCopy.label}
              // The `meaning` doubles as the accessibility hint. A screen-reader
              // user gets the consequence for their money spoken aloud — the same
              // sentence the "i" sheet shows sighted users, so neither audience
              // has to reach the other's affordance to learn what this does.
              accessibilityHint={s.fulfilCopy.meaning}
              accessibilityState={{ disabled: s.working }}
              style={({ pressed }) => [
                styles.button,
                styles.primary,
                pressed && styles.pressed,
                s.working && styles.disabled,
              ]}
            >
              <Text style={styles.primaryLabel}>{s.fulfilCopy.label}</Text>
            </Pressable>
          ) : null}

          {s.undoCopy ? (
            <Pressable
              onPress={s.doUndo}
              disabled={s.working}
              accessibilityRole="button"
              accessibilityLabel={s.undoCopy.label}
              accessibilityHint={s.undoCopy.meaning}
              accessibilityState={{ disabled: s.working }}
              style={({ pressed }) => [
                styles.button,
                styles.ghost,
                pressed && styles.pressed,
                s.working && styles.disabled,
              ]}
            >
              <Text style={styles.ghostLabel}>{s.undoCopy.label}</Text>
            </Pressable>
          ) : null}

          {/* D2 — one trigger for the whole bar, at the END of the row rather
              than beside a particular action. It was previously rendered only
              when there was a fulfilment button, which meant a booking offering
              just Undo, or just Flag, explained nothing. Fixed position so it is
              in the same place whatever the booking's status. */}
          <ActionInfoTrigger onPress={s.openInfo} />
        </View>

        {/* I9 — its own row, not squeezed beside the primary action. Flagging is
            an escalation, not an alternative to finishing the booking, and a
            destructive-looking control next to the main one invites mis-taps. */}
        {s.flagCopy ? (
          <View style={styles.flagRow}>
            <Pressable
              onPress={s.openFlag}
              accessibilityRole="button"
              accessibilityLabel={s.flagCopy.label}
              accessibilityHint={s.flagCopy.meaning}
              style={({ pressed }) => [
                styles.button,
                styles.danger,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.dangerLabel}>{s.flagCopy.label}</Text>
            </Pressable>
          </View>
        ) : null}

        <ActionInfoSheet
          visible={s.infoOpen}
          actions={s.visibleActions}
          onClose={s.closeInfo}
        />

        <RejectReasonSheet
          visible={s.flagOpen}
          bookerName={booking.bookerName}
          onConfirm={s.confirmFlag}
          onClose={s.closeFlag}
          title="Something's wrong?"
          body="Ezzy will step in and review this booking. Your payout stays on hold until it's sorted out."
          placeholder="What went wrong?"
          confirmLabel="Flag for review"
          cancelLabel="Never mind"
          confirmHint="Puts the booking on hold and asks Ezzy to review it"
          minLength={s.minFlagReason}
        />
      </View>
    )
  }

  // ── nothing for the vendor to do ──────────────────────────────────────────
  // Reached only by genuinely settled states (completed, cancelled, refunded) and
  // by `disputed`, where only Ezzy can act. Uses `statusLabel`, not the raw
  // column, so this can never read "This booking is in_progress".
  return (
    <View style={styles.resolved}>
      <Text style={styles.resolvedText}>
        {booking.status === "cancelled" && booking.rejectionReason
          ? `Rejected — ${booking.rejectionReason}`
          : booking.status === "disputed"
            ? "On hold while Ezzy reviews it. You'll be notified when it's sorted."
            : `This booking is ${statusLabel(booking.status).toLowerCase()}. No action needed.`}
      </Text>
    </View>
  )
}
