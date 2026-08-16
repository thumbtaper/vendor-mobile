import { useMemo } from "react"
import { Text, View } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./DashboardSection.styles"

/**
 * A titled group of dashboard widgets — mobile's counterpart to the web portal's
 * `DashboardSection`.
 *
 * Pure display: no state, no effects, no handlers, so it ships as `.tsx` +
 * `.styles.ts` with no companion hook (`component-separation` §4).
 *
 * ⚠️ THE CAPTION IS NOT DECORATION. One period control now drives two groups that
 * count on **different clocks**: Operations filters `bookings.booked_date` — the
 * day a job is booked FOR — while Earnings filters
 * `booking_transactions.created_at`, the day money was PAID. The same dates select
 * different rows, so the two groups can legitimately disagree. The web portal
 * states plainly that the equivalence is *"denied in words rather than by having
 * two controls"* and that removing the captions "returns the objection". Grouping
 * the cards without captioning them would import the layout and drop the thing
 * that makes it honest.
 *
 * `accessibilityRole="header"` gives the screen a heading structure, so a screen
 * reader user can tell the two groups apart rather than meeting seven
 * undifferentiated cards.
 */
export function DashboardSection({
  title,
  caption,
  children,
}: {
  title: string
  /** States the clock these figures count on, and any caveat about them. */
  caption?: string
  children: React.ReactNode
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      {children}
    </View>
  )
}
