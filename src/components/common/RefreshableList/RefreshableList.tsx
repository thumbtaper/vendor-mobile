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
  /**
   * Overrides the content container's top padding only. `spacing.xl` is right
   * when the list is the first thing under the screen header, but wrong when a
   * control sits directly above it — bookings has a filter strip there, so the
   * default 24 lands on top of the strip's own padding and does no work.
   * Left-, right- and bottom padding are untouched, so cards keep their inset.
   */
  contentPaddingTop?: number
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
  contentPaddingTop,
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

  // Memoised because FlashList re-measures its content container when the style
  // identity changes; a fresh array every render would fight the layout pass.
  // FlashList v2 extends `ScrollViewProps`, so this is a plain
  // `StyleProp<ViewStyle>` and an array is accepted.
  const contentStyle = useMemo(() => {
    const base = contentContainerStyle ?? styles.content
    return contentPaddingTop === undefined
      ? base
      : [base, { paddingTop: contentPaddingTop }]
  }, [contentContainerStyle, contentPaddingTop, styles])

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
      contentContainerStyle={contentStyle}
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
