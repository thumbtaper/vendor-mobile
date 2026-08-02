import {
  Archive,
  Bell,
  CalendarPlus,
  CircleAlert,
  CircleCheck,
  CircleDollarSign,
  CircleX,
  CreditCard,
  PackageCheck,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react-native"
import { useMemo } from "react"
import { Alert, Pressable, Text, View } from "react-native"
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable"

import { fmtRelativeTime } from "@/lib/format"
import type { AppNotification, NotificationType } from "@/lib/types"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./NotificationListItem.styles"

// Ported from `vendor/components/layout/NotificationPanel/NotificationItem.tsx`'s
// `TYPE_ICON` — same glyph and same colour per type, so a vendor who uses both
// clients reads the same signal. Canonical lucide v1 names: the web app is on
// `lucide-react` 0.468 and still uses the pre-v1 spellings (`AlertCircle`,
// `CheckCircle2`, `XCircle`), which survive here only as legacy aliases.
//
// An exhaustive `Record<NotificationType, …>` rather than a switch: adding a member
// to `NotificationType` then becomes a compile error instead of a silently
// icon-less row. Colours are per-type data, so they live here beside the glyph
// rather than in the style file.
//
// The exhaustive Record is a COMPILE-time guard only. It cannot stop the database
// emitting a type this binary has never heard of — a migration ships new
// notification types to users running an older build, and no amount of typing
// reaches an app that is already installed. Hence UNKNOWN_TYPE below.
//
// Colours match the status palette in theme/tokens.ts so a "flagged" notification
// and a "flagged" booking read as the same event.
const TYPE_ICON: Record<NotificationType, { icon: LucideIcon; color: string }> = {
  new_booking: { icon: CalendarPlus, color: "#3b82f6" },
  payment_confirmed: { icon: CreditCard, color: "#10b981" },
  booking_confirmed: { icon: CircleCheck, color: "#10b981" },
  booking_rejected: { icon: CircleX, color: "#ef4444" },
  booking_cancelled: { icon: CircleAlert, color: "#f59e0b" },
  vendor_pending_approval: { icon: CircleCheck, color: "#3b82f6" },
  new_user_registration: { icon: CircleCheck, color: "#3b82f6" },
  // Fulfilment types (20260801000007). Only the four inserted with
  // `portal = 'vendor'` — see the note on NotificationType.
  booking_returned: { icon: PackageCheck, color: "#f97316" },
  booking_completed: { icon: CircleDollarSign, color: "#3b82f6" },
  booking_disputed: { icon: TriangleAlert, color: "#e11d48" },
  dispute_resolved: { icon: ShieldCheck, color: "#10b981" },
}

// Rendered when the row's type is not in TYPE_ICON. A generic bell is the correct
// outcome for a notification we cannot classify: the title and body come from the
// server and are still perfectly readable, so the row stays useful.
//
// This is load-bearing, not defensive padding. The lookup below is destructured,
// and destructuring `undefined` throws a TypeError; there is no error boundary in
// this app, so an unrecognised type would take the whole Notifications screen down.
const UNKNOWN_TYPE = { icon: Bell, color: "#64748b" } as const

interface Props {
  notification: AppNotification
  onToggleRead: (notification: AppNotification) => void
  onArchive: (notification: AppNotification) => void
  onDelete: (notification: AppNotification) => void
  /** Archived rows can't be archived again; only deleted. */
  archived?: boolean
}

// Pure display: every handler is passed in. Swipe is a shortcut, never the only
// path (plan §5.2) — archive also has a 44pt button in the row, and delete is
// reachable by long-press. A swipe-only action is invisible to a screen reader.
export function NotificationListItem({
  notification,
  onToggleRead,
  onArchive,
  onDelete,
  archived = false,
}: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const { icon: TypeIcon, color: typeColor } =
    TYPE_ICON[notification.type] ?? UNKNOWN_TYPE

  const confirmDelete = () => {
    Alert.alert(
      "Delete this notification?",
      "It will be removed permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(notification),
        },
      ],
    )
  }

  const renderLeftActions = () =>
    archived ? null : (
      <View style={[styles.action, styles.actionArchive]}>
        <Archive size={20} color="#3b82f6" />
        <Text style={[styles.actionLabel, styles.archiveLabel]}>Archive</Text>
      </View>
    )

  const renderRightActions = () => (
    <View style={[styles.action, styles.actionDelete]}>
      <Trash2 size={20} color="#ef4444" />
      <Text style={[styles.actionLabel, styles.deleteLabel]}>Delete</Text>
    </View>
  )

  return (
    <ReanimatedSwipeable
      friction={2}
      leftThreshold={64}
      rightThreshold={64}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      // `direction` is the direction the ROW MOVED, not the panel that opened.
      // ReanimatedSwipeable reports `toValue > 0 ? RIGHT : LEFT`, and opening the
      // *left* panel translates the row *right* — so a swipe-right reveals
      // `renderLeftActions` (Archive) and arrives here as "right". Reading it as
      // the panel side inverts both branches: the Archive icon prompted a delete,
      // and the Delete icon archived with no confirmation at all.
      onSwipeableOpen={(direction) => {
        if (direction === "right" && !archived) onArchive(notification)
        if (direction === "left") confirmDelete()
      }}
    >
      <Pressable
        onPress={() => onToggleRead(notification)}
        onLongPress={confirmDelete}
        accessibilityRole="button"
        accessibilityLabel={`${notification.title}. ${
          notification.is_read ? "Read" : "Unread"
        }`}
        accessibilityHint="Double tap to toggle read. Long press to delete."
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        {notification.is_read ? (
          <View style={styles.readSpacer} />
        ) : (
          <View style={styles.unreadDot} />
        )}

        <View style={styles.body}>
          {/* Icon leads the title, matching the web row. Decorative — the title
              text carries the meaning and the Pressable already has a label — so
              it is left out of the accessibility tree. */}
          <View style={styles.titleRow}>
            <View style={styles.typeIcon}>
              <TypeIcon size={16} color={typeColor} />
            </View>
            <Text
              style={[styles.title, notification.is_read && styles.titleRead]}
            >
              {notification.title}
            </Text>
          </View>
          {notification.body ? (
            <Text style={styles.message}>{notification.body}</Text>
          ) : null}
          <Text style={styles.time}>
            {fmtRelativeTime(notification.created_at)}
          </Text>
        </View>

        {archived ? null : (
          <Pressable
            onPress={() => onArchive(notification)}
            accessibilityRole="button"
            accessibilityLabel="Archive notification"
            style={styles.archiveButton}
          >
            <Archive size={18} color={tokens.text} />
          </Pressable>
        )}
      </Pressable>
    </ReanimatedSwipeable>
  )
}
