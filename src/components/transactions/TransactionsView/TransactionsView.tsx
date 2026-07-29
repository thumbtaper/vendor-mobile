import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"

import { RefreshableList } from "@/components/common/RefreshableList/RefreshableList"
import { SearchField } from "@/components/common/SearchField/SearchField"
import { StaleBanner } from "@/components/common/StaleBanner/StaleBanner"
import { TransactionListItem } from "@/components/transactions/TransactionListItem/TransactionListItem"
import { TransactionSummaryCards } from "@/components/transactions/TransactionSummaryCards/TransactionSummaryCards"
import { WINDOW_PRESETS } from "@/hooks/useTransactionsQuery"
import type { Transaction } from "@/lib/types"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./TransactionsView.styles"
import { useTransactionsView } from "./useTransactionsView"

export function TransactionsView() {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useTransactionsView()

  return (
    <>
      <View style={styles.toolbar}>
        <View style={styles.presets} accessibilityRole="tablist">
          {WINDOW_PRESETS.map((preset) => {
            const active = preset.value === s.preset
            return (
              <Pressable
                key={preset.value}
                onPress={() => s.setPreset(preset.value)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.preset, active && styles.presetActive]}
              >
                <Text
                  style={[
                    styles.presetLabel,
                    active && styles.presetLabelActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <SearchField
          placeholder="Search booker or offering"
          onChange={s.setSearch}
        />
      </View>

      <StaleBanner
        dataUpdatedAt={s.dataUpdatedAt}
        isError={s.isError}
        isFetching={s.isFetching}
      />

      <TransactionSummaryCards
        totals={s.totals}
        loading={s.totalsLoading}
        contactsFailed={s.contactsFailed}
      />

      {s.searchScopeNote ? (
        <Text style={styles.note}>{s.searchScopeNote}</Text>
      ) : null}

      <RefreshableList<Transaction>
        data={s.transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionListItem transaction={item} />}
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
