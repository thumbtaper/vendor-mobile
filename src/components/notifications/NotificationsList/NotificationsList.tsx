import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"

import { RefreshableList } from "@/components/common/RefreshableList/RefreshableList"
import { ScreenTitle } from "@/components/common/ScreenTitle/ScreenTitle"
import { StaleBanner } from "@/components/common/StaleBanner/StaleBanner"
import { NotificationListItem } from "@/components/notifications/NotificationListItem/NotificationListItem"
import { PushPermissionCard } from "@/components/notifications/PushPermissionCard/PushPermissionCard"
import { usePush } from "@/providers/PushProvider"
import type { AppNotification } from "@/lib/types"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./NotificationsList.styles"
import { useNotificationsList } from "./useNotificationsList"

export function NotificationsList() {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useNotificationsList()
  const push = usePush()

  // Everything above the rows now scrolls (B1). Inline element, not a component —
  // see `RefreshableList`'s `header` prop.
  const header = (
    <>
      <ScreenTitle />

      {/* Only shown on the Inbox — the prompt belongs where new alerts land. */}
      {s.archived ? null : (
        <PushPermissionCard state={push.state} onEnable={push.enable} />
      )}

      <View style={styles.toolbar}>
        <View style={styles.segmented} accessibilityRole="tablist">
          <Pressable
            onPress={() => s.setArchived(false)}
            accessibilityRole="tab"
            accessibilityState={{ selected: !s.archived }}
            style={[styles.segment, !s.archived && styles.segmentActive]}
          >
            <Text
              style={[
                styles.segmentLabel,
                !s.archived && styles.segmentLabelActive,
              ]}
            >
              Inbox
            </Text>
          </Pressable>
          <Pressable
            onPress={() => s.setArchived(true)}
            accessibilityRole="tab"
            accessibilityState={{ selected: s.archived }}
            style={[styles.segment, s.archived && styles.segmentActive]}
          >
            <Text
              style={[
                styles.segmentLabel,
                s.archived && styles.segmentLabelActive,
              ]}
            >
              Archived
            </Text>
          </Pressable>
        </View>

        {!s.archived && s.hasUnread ? (
          <Pressable
            onPress={s.readAll}
            accessibilityRole="button"
            style={styles.readAll}
          >
            <Text style={styles.readAllLabel}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      <StaleBanner
        dataUpdatedAt={s.dataUpdatedAt}
        isError={s.isError}
        isFetching={s.isFetching}
      />
    </>
  )

  return (
    <>
      <RefreshableList<AppNotification>
        header={header}
        data={s.notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationListItem
            notification={item}
            archived={s.archived}
            onToggleRead={s.toggleRead}
            onArchive={s.archive}
            onDelete={s.destroy}
          />
        )}
        onRefresh={s.refresh}
        onEndReached={s.loadMore}
        onEndReachedThreshold={0.5}
        loading={s.isLoading}
        loadingMore={s.isFetchingNextPage}
        error={s.errorMessage}
        onRetry={s.refresh}
        emptyTitle={s.emptyTitle}
        emptyBody={s.emptyBody}
      />
    </>
  )
}
