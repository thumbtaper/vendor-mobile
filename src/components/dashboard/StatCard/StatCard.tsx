import { LinearGradient } from "expo-linear-gradient"
import type { LucideIcon } from "lucide-react-native"
import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"

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
  /**
   * Makes the card a press target. OPTIONAL on purpose: a card without one
   * renders exactly as it always has — same `View`, same `summary` role, no press
   * state — so a tile with nowhere to go never claims to be tappable.
   */
  onPress?: () => void
  /**
   * Where `onPress` goes, for screen readers. Required in practice whenever
   * `onPress` is supplied: "Completed, 12, button" does not tell a TalkBack user
   * what tapping does, and the card's own text cannot say it.
   */
  accessibilityHint?: string
}

// Pure display — mirrors `vendor/components/ui/StatCard`. Skeletons rather than a
// spinner over a blank page (plan §5.1), so the layout does not jump when the
// numbers land.
//
// INTERACTIVITY IS OPT-IN, and the history matters. D4-a
// (`.plans/2026-07-29-vendor-mobile-styling-branding.md:289-294`) forbade a
// pressable affordance on these tiles — but its stated reason was that they had no
// destination, making the affordance a lie. The dashboard range plan (D2, resolved
// 2026-08-14) supplies real destinations, which MEETS that condition rather than
// overturning it. So: a card given `onPress` becomes a real button; a card without
// one is byte-for-byte the non-interactive tile D4-a described, and adding a press
// affordance to a card with nowhere to go is still forbidden.
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
  onPress,
  accessibilityHint,
}: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const content = (
    <>
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
    </>
  )

  if (!onPress) {
    return (
      <View style={styles.card} accessibilityRole="summary">
        {content}
      </View>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      // `accessible` is explicit, not incidental. Without it the card's three
      // Texts are focused separately, and the button role and the hint — the only
      // things that say what tapping does — land on a node TalkBack never
      // reaches. With it, the card is one target that reads
      // "Completed, 12, Aug 2026, button" followed by the hint.
      accessible
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      // No `hitSlop`: unlike the filter chips, this card is far larger than the
      // 44pt minimum in both axes on every supported width (`flexBasis: 47%`
      // ≈ 128dp wide, and taller still).
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  )
}
