import { useMemo } from "react"
import { Text, View } from "react-native"

import { StatCard } from "@/components/dashboard/StatCard/StatCard"
import { fmtPeso } from "@/lib/format"
import type { TransactionTotals } from "@/services/transactions.service"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./TransactionSummaryCards.styles"

// Pure display. Reuses StatCard rather than a near-identical second card
// component — same visual language, one place to change it.
export function TransactionSummaryCards({
  totals,
  loading,
  contactsFailed,
}: {
  totals: TransactionTotals | null
  loading: boolean
  contactsFailed: boolean
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        <StatCard
          label="Collected"
          value={fmtPeso(totals?.collected ?? 0, 0)}
          sub="From bookers"
          loading={loading}
        />
        <StatCard
          label="Your payout"
          value={fmtPeso(totals?.payout ?? 0, 0)}
          sub="After platform fee"
          loading={loading}
        />
        <StatCard
          label="Platform fees"
          value={fmtPeso(totals?.platformFees ?? 0, 0)}
          loading={loading}
        />
        <StatCard
          label="Transactions"
          value={totals?.totalCount ?? 0}
          sub={
            totals
              ? `${totals.payableCount} counted in totals`
              : undefined
          }
          loading={loading}
        />
      </View>

      {/* The web page makes the same distinction in words, and it has to stay:
          totals cover payable rows only, while the count covers every row. */}
      <Text style={styles.note}>
        Totals exclude pending, cancelled and refunded bookings.
      </Text>

      {totals && !totals.complete ? (
        <Text style={styles.warning}>
          This range has more transactions than can be totalled here. Narrow the
          range for exact figures.
        </Text>
      ) : null}

      {contactsFailed ? (
        <Text style={styles.warning}>
          Booker details couldn&apos;t be loaded, so search by name, email or
          phone won&apos;t match. The amounts are still correct.
        </Text>
      ) : null}
    </View>
  )
}
