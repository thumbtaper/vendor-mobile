import { LinearGradient } from "expo-linear-gradient"
import type { LucideIcon } from "lucide-react-native"
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
  icon: LucideIcon
  /** Glyph colour and its tinted chip background — per card, as on the web. */
  iconColor: string
  iconBg: string
  /** Draws the amber→orange bar along the top edge. */
  urgent?: boolean
}

// Pure display — mirrors `vendor/components/ui/StatCard`. Skeletons rather than a
// spinner over a blank page (plan §5.1), so the layout does not jump when the
// numbers land.
//
// Not interactive, and deliberately not styled to look interactive: these are
// summary tiles, so there is no Pressable, no press state and no `button` role
// (plan D4-a). If they ever gain a destination, that is a behaviour change.
export function StatCard({
  label,
  value,
  sub,
  loading,
  unavailable,
  icon: Icon,
  iconColor,
  iconBg,
  urgent = false,
}: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <View style={styles.card} accessibilityRole="summary">
      {/* First child and absolutely positioned, so it overlays the top edge
          without displacing the header row. */}
      {urgent ? (
        <LinearGradient
          colors={tokens.accentUrgent.colors}
          start={tokens.accentUrgent.start}
          end={tokens.accentUrgent.end}
          style={styles.accentBar}
        />
      ) : null}

      <View style={styles.headerRow}>
        {/* Two lines maximum: at 320dp the label has ~58dp beside the chip, and a
            third line would make the row heights diverge badly. */}
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
        {/* Decorative — the label names the metric, so the chip stays out of the
            accessibility tree and the card reads as one summary. */}
        <View style={[styles.iconChip, { backgroundColor: iconBg }]}>
          <Icon size={16} color={iconColor} />
        </View>
      </View>
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
