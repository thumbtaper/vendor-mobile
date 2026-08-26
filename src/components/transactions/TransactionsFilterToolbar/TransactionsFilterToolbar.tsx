import { CalendarDays, ChevronDown } from "lucide-react-native"
import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"

import { FilterOptionSheet } from "@/components/common/FilterOptionSheet/FilterOptionSheet"
import { SearchField } from "@/components/common/SearchField/SearchField"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./TransactionsFilterToolbar.styles"
import type { UseTransactionsFilterToolbarInput } from "./useTransactionsFilterToolbar"
import { useTransactionsFilterToolbar } from "./useTransactionsFilterToolbar"

interface Props extends UseTransactionsFilterToolbarInput {
  onSearch: (value: string) => void
}

export function TransactionsFilterToolbar({ onSearch, ...input }: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useTransactionsFilterToolbar(input)

  return (
    <>
      <View style={styles.toolbar}>
        <View style={styles.topRow}>
          <Pressable
            onPress={s.openSheet}
            accessibilityRole="button"
            accessibilityLabel={`Transaction date filter, ${s.dateLabel}`}
            style={({ pressed }) => [
              styles.dateButton,
              pressed && styles.dateButtonPressed,
            ]}
          >
            <View style={styles.iconWrap}>
              <CalendarDays size={16} color={tokens.accent} />
            </View>
            <View style={styles.dateText}>
              <Text style={styles.eyebrow}>Date</Text>
              <Text style={styles.value} numberOfLines={1}>
                {s.dateLabel}
              </Text>
            </View>
            <ChevronDown size={16} color={tokens.text} />
          </Pressable>

          <View style={styles.searchWrap}>
            <SearchField
              placeholder="Search booker or offering"
              onChange={onSearch}
            />
          </View>
        </View>
      </View>

      <FilterOptionSheet
        visible={s.open}
        title="Payout period"
        subtitle="Totals and rows update together. Transactions stay bounded."
        options={s.dateOptions}
        onClose={s.closeSheet}
      />
    </>
  )
}
