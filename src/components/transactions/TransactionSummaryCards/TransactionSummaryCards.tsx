import { ClipboardList, Percent, Receipt, Wallet } from "lucide-react-native"
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
      {/* Glyphs and tints match the web summary strip
          (`vendor/components/transactions/TransactionSummaryCards`) by meaning, not
          by position — the web orders them Collected / Platform Fee / Total Payout.
          The count card has no web counterpart: it takes `ClipboardList` in neutral
          slate (plan D5-a), the neutral tint marking it as a count rather than a
          fourth currency figure. */}
      <View style={styles.grid}>
        <StatCard
          label="Collected"
          value={fmtPeso(totals?.collected ?? 0, 0)}
          sub="From bookers"
          loading={loading}
          icon={Receipt}
          iconColor="#3b82f6"
          iconBg="rgba(59,130,246,0.12)"
        />
        <StatCard
          label="Your payout"
          value={fmtPeso(totals?.payout ?? 0, 0)}
          sub="After platform fee"
          loading={loading}
          icon={Wallet}
          iconColor="#10b981"
          iconBg="rgba(16,185,129,0.12)"
        />
        <StatCard
          label="Platform fees"
          value={fmtPeso(totals?.platformFees ?? 0, 0)}
          loading={loading}
          icon={Percent}
          iconColor="#f59e0b"
          iconBg="rgba(245,158,11,0.12)"
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
          icon={ClipboardList}
          iconColor="#64748b"
          iconBg="rgba(100,116,139,0.12)"
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
