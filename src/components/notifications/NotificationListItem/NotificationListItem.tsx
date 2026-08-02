import {
  Archive,
  CalendarPlus,
  CircleAlert,
  CircleCheck,
  CircleX,
  CreditCard,
  Trash2,
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
const TYPE_ICON: Record<NotificationType, { icon: LucideIcon; color: string }> = {
  new_booking: { icon: CalendarPlus, color: "#3b82f6" },
  payment_confirmed: { icon: CreditCard, color: "#10b981" },
  booking_confirmed: { icon: CircleCheck, color: "#10b981" },
  booking_rejected: { icon: CircleX, color: "#ef4444" },
  booking_cancelled: { icon: CircleAlert, color: "#f59e0b" },
  vendor_pending_approval: { icon: CircleCheck, color: "#3b82f6" },
  new_user_registration: { icon: CircleCheck, color: "#3b82f6" },
}

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
  const { icon: TypeIcon, color: typeColor } = TYPE_ICON[notification.type]

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
