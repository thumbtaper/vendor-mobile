import { FlashList, type FlashListProps } from "@shopify/flash-list"
import { useMemo } from "react"
import { ActivityIndicator, RefreshControl, Text, View } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./RefreshableList.styles"
import { useRefreshableList } from "./useRefreshableList"

interface Props<T> extends Omit<FlashListProps<T>, "refreshControl"> {
  onRefresh: () => Promise<unknown>
  /** True on the first load, when there is nothing to show yet. */
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyTitle?: string
  emptyBody?: string
  loadingMore?: boolean
}

// Thin wrapper over FlashList v2 — no `estimatedItemSize`, which v2 removed in
// favour of automatic sizing. Owns the four states every data surface must have
// (plan §5.1) so no screen can quietly ship only the populated one.
export function RefreshableList<T>({
  onRefresh,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = "Nothing here yet",
  emptyBody,
  loadingMore = false,
  data,
  contentContainerStyle,
  ItemSeparatorComponent,
  ...listProps
}: Props<T>) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const { refreshing, refresh } = useRefreshableList(onRefresh)

  // Defaulted here rather than per screen so bookings, transactions and
  // notifications cannot drift apart. Identity must be stable: FlashList's cell
  // memo compares `ItemSeparatorComponent` by reference, so an inline component
  // would remount every separator on each render. `styles` is already memoised on
  // `tokens`, so this changes only when the theme does.
  const Separator = useMemo(
    () =>
      ItemSeparatorComponent ??
      function RowSeparator() {
        return <View style={styles.separator} />
      },
    [ItemSeparatorComponent, styles],
  )

  const isEmpty = !data || data.length === 0

  if (loading && isEmpty) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator color={tokens.text} />
      </View>
    )
  }

  if (error && isEmpty) {
    return (
      <View style={styles.centred}>
        <Text style={styles.messageTitle}>Couldn&apos;t load this</Text>
        <Text style={styles.message}>{error}</Text>
        {onRetry ? (
          <Text
            style={styles.messageTitle}
            onPress={onRetry}
            accessibilityRole="button"
          >
            Try again
          </Text>
        ) : null}
      </View>
    )
  }

  return (
    <FlashList
      {...listProps}
      data={data}
      contentContainerStyle={contentContainerStyle ?? styles.content}
      ItemSeparatorComponent={Separator}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={tokens.text}
          colors={[tokens.strong]}
          progressBackgroundColor={tokens.cardBg}
        />
      }
      ListEmptyComponent={
        <View style={styles.centred}>
          <Text style={styles.messageTitle}>{emptyTitle}</Text>
          {emptyBody ? <Text style={styles.message}>{emptyBody}</Text> : null}
        </View>
      }
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator color={tokens.text} />
          </View>
        ) : null
      }
    />
  )
}
