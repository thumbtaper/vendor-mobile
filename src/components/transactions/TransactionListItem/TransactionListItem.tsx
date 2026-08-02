import { useMemo } from "react"
import { Text, View } from "react-native"

import {
  fmtPeso,
  fmtPhDate,
  isPayable,
  payoutExclusionReason,
  statusLabel,
} from "@/lib/format"
import type { Transaction } from "@/lib/types"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./TransactionListItem.styles"

// Pure display. The strikethrough plus its explanation are ported deliberately:
// an excluded `pending` payout means "not yet", while cancelled/refunded means
// "not ever", and both render struck through — without the reason they read as
// the same verdict.
export function TransactionListItem({ transaction }: { transaction: Transaction }) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  // Payability comes from the LEDGER's payout status; the pill below still shows
  // the BOOKING's status. They answer different questions and must not be merged:
  // a `completed` booking whose payout was reversed is still shown as completed.
  const payable = isPayable(transaction.payoutStatus)
  const exclusion = payoutExclusionReason(transaction.payoutStatus)
  const status = tokens.status[transaction.status] ?? {
    bg: tokens.pillBg,
    fg: tokens.text,
  }

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <View style={styles.headerBody}>
          <Text style={styles.name} numberOfLines={1}>
            {transaction.bookerName || "Unnamed booker"}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {transaction.offeringName || "—"}
            {transaction.offeringCode ? ` · ${transaction.offeringCode}` : ""}
          </Text>
          <Text style={styles.meta}>
            Paid {fmtPhDate(transaction.transactionDate)}
          </Text>
        </View>
        <Text style={[styles.payout, !payable && styles.payoutExcluded]}>
          {fmtPeso(transaction.payoutAmount)}
        </Text>
      </View>

      <Text style={[styles.badge, { backgroundColor: status.bg, color: status.fg }]}>
        {statusLabel(transaction.status)}
      </Text>

      {exclusion ? <Text style={styles.exclusion}>{exclusion}</Text> : null}

      <View style={styles.breakdown}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Paid</Text>
          <Text style={styles.breakdownValue}>
            {fmtPeso(transaction.amountPaid)}
          </Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>
            Fee ({transaction.platformFeePercent}%)
          </Text>
          <Text style={styles.breakdownValue}>
            {fmtPeso(transaction.platformFeeAmount)}
          </Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Payout</Text>
          <Text style={styles.breakdownValue}>
            {fmtPeso(transaction.payoutAmount)}
          </Text>
        </View>
      </View>
    </View>
  )
}
