import { useMemo } from "react"
import { Text } from "react-native"

import { RefreshableList } from "@/components/common/RefreshableList/RefreshableList"
import { ScreenTitle } from "@/components/common/ScreenTitle/ScreenTitle"
import { StaleBanner } from "@/components/common/StaleBanner/StaleBanner"
import { TransactionsFilterToolbar } from "@/components/transactions/TransactionsFilterToolbar/TransactionsFilterToolbar"
import { TransactionListItem } from "@/components/transactions/TransactionListItem/TransactionListItem"
import { TransactionSummaryCards } from "@/components/transactions/TransactionSummaryCards/TransactionSummaryCards"
import type { Transaction } from "@/lib/types"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./TransactionsView.styles"
import { useTransactionsView } from "./useTransactionsView"

export function TransactionsView() {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useTransactionsView()

  // Everything that used to be pinned above the list (B1). Written inline: React
  // reconciles by element type, so the SearchField below keeps its focus and its
  // text across renders. Passing a component instead would remount it on every
  // keystroke — see `RefreshableList`'s `header` prop.
  const header = (
    <>
      <ScreenTitle />

      <TransactionsFilterToolbar
        window={s.window}
        onWindowChange={s.setWindow}
        onSearch={s.setSearch}
      />

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
    </>
  )

  return (
    <>
      <RefreshableList<Transaction>
        header={header}
        separateHeaderFromRows
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
