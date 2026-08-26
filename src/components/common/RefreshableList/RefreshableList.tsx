import { FlashList, type FlashListProps } from "@shopify/flash-list"
import { useMemo, type ReactElement } from "react"
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { useScreenChrome } from "@/components/common/ScreenShell/ScreenChromeContext"
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
   * Everything that scrolls above the rows — the screen title, a toolbar, filter
   * chips, summary cards (B1).
   *
   * An **element**, not a component type, and that distinction is load-bearing.
   * React reconciles an element by its `type`, so `header={<Toolbar />}` written
   * inline is stable across renders and `Toolbar` keeps its state. A component —
   * `ListHeaderComponent={() => <Toolbar />}` — is a NEW function identity every
   * render, which remounts the whole subtree. The Transactions header contains a
   * search field: remounting it drops focus and closes the keyboard on every
   * keystroke. Same reference-identity rule as `ItemSeparatorComponent` below.
   *
   * Rendered in all four states, deliberately — see the state branches.
   */
  header?: ReactElement
  /**
   * Overrides the content container's top padding only. `spacing.xl` is right
   * when the list is the first thing under the screen header, but wrong when a
   * control sits directly above it.
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
  header,
  contentPaddingTop,
  data,
  contentContainerStyle,
  ItemSeparatorComponent,
  onScroll,
  ...listProps
}: Props<T>) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const chrome = useScreenChrome()
  const { refreshing, refresh, contentBottomPadding } =
    useRefreshableList(onRefresh)

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
  //
  // The bottom padding is appended LAST and unconditionally, including when a
  // caller supplies its own `contentContainerStyle` — clearing the floating tab
  // bar is not something a screen should be able to opt out of by accident (I1).
  const contentStyle = useMemo(() => {
    const base = contentContainerStyle ?? styles.content
    const overrides: { paddingBottom: number; paddingTop?: number } = {
      paddingBottom: contentBottomPadding,
    }
    if (contentPaddingTop !== undefined) overrides.paddingTop = contentPaddingTop
    return [base, overrides]
  }, [contentContainerStyle, contentPaddingTop, contentBottomPadding, styles])

  const isEmpty = !data || data.length === 0
  const handleScroll = useMemo(
    () =>
      onScroll
        ? ((event: Parameters<NonNullable<typeof onScroll>>[0]) => {
            chrome.onScroll(event)
            onScroll(event)
          })
        : chrome.onScroll,
    [chrome, onScroll],
  )

  // The header renders in the loading and error states too, not only alongside
  // rows. Without this the vendor loses the filter chips and date presets in
  // exactly the two states where they need them most — to change the query that
  // is failing or returning nothing. This component's whole job is that no screen
  // ships only the populated state; a header that vanishes in half of them would
  // break the same contract from the inside.
  if (loading && isEmpty) {
    return (
      <ScrollView
        contentContainerStyle={styles.stateContent}
        scrollEnabled={header !== undefined}
        onScroll={handleScroll}
        scrollEventThrottle={chrome.scrollEventThrottle}
      >
        {header}
        <View style={styles.centred}>
          <ActivityIndicator color={tokens.text} />
        </View>
      </ScrollView>
    )
  }

  if (error && isEmpty) {
    return (
      <ScrollView
        contentContainerStyle={styles.stateContent}
        scrollEnabled={header !== undefined}
        onScroll={handleScroll}
        scrollEventThrottle={chrome.scrollEventThrottle}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={tokens.text}
            colors={[tokens.strong]}
            progressBackgroundColor={tokens.cardBg}
          />
        }
      >
        {header}
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
      </ScrollView>
    )
  }

  return (
    <FlashList
      {...listProps}
      data={data}
      contentContainerStyle={contentStyle}
      ListHeaderComponent={header}
      ItemSeparatorComponent={Separator}
      onScroll={handleScroll}
      scrollEventThrottle={chrome.scrollEventThrottle}
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
