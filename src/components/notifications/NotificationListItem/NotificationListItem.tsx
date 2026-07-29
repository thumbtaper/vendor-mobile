import { Archive, Trash2 } from "lucide-react-native"
import { useMemo } from "react"
import { Alert, Pressable, Text, View } from "react-native"
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable"

import { fmtRelativeTime } from "@/lib/format"
import type { AppNotification } from "@/lib/types"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./NotificationListItem.styles"

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
      onSwipeableOpen={(direction) => {
        if (direction === "left" && !archived) onArchive(notification)
        if (direction === "right") confirmDelete()
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
          <Text
            style={[styles.title, notification.is_read && styles.titleRead]}
          >
            {notification.title}
          </Text>
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
