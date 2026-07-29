import { useMemo } from "react"
import { Text, View } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./StatCard.styles"

interface Props {
  label: string
  value: string | number
  sub?: string
  loading?: boolean
  /** Renders a dash and an explanation instead of a number. */
  unavailable?: boolean
}

// Pure display — mirrors `vendor/components/ui/StatCard`. Skeletons rather than a
// spinner over a blank page (plan §5.1), so the layout does not jump when the
// numbers land.
export function StatCard({ label, value, sub, loading, unavailable }: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.label}>{label}</Text>
      {loading ? (
        <>
          <View style={styles.skeleton} />
          <View style={styles.skeletonSub} />
        </>
      ) : unavailable ? (
        <>
          <Text style={styles.unavailable}>—</Text>
          <Text style={styles.sub}>{sub ?? "Unavailable"}</Text>
        </>
      ) : (
        <>
          <Text style={styles.value}>{value}</Text>
          {sub ? <Text style={styles.sub}>{sub}</Text> : null}
        </>
      )}
    </View>
  )
}
