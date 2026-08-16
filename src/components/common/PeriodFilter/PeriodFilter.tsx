import { LinearGradient } from "expo-linear-gradient"
import { useMemo } from "react"
import { Pressable, ScrollView, Text } from "react-native"

import { PERIOD_PRESETS, presetForWindow, windowFor } from "@/lib/dateWindows"
import { phToday } from "@/lib/format"
import type { DateWindow } from "@/lib/types"
import { useAppTheme } from "@/theme/useAppTheme"
import { CHIP_HIT_SLOP, makeStyles } from "./PeriodFilter.styles"

/**
 * The app's period control — one strip, shared by the dashboard, the bookings list
 * and the transactions ledger (dashboard range plan B2).
 *
 * Pure display, fully controlled: no state, no effects, so per
 * `.claude/skills/component-separation/SKILL.md` §4 it ships as `.tsx` +
 * `.styles.ts` with **no companion hook**. The window lives in each screen's own
 * hook, which is what lets three screens share one strip without sharing state.
 *
 * ⚠️ It speaks `DateWindow` in BOTH directions rather than preset names, and that
 * is the point of D1(c): screens only ever hold a window, so adding a custom range
 * later is a new chip here, not a refactor of three screens. Translating between a
 * chip and a window is this component's single responsibility — `presetForWindow`
 * on the way in, `windowFor` on the way out.
 *
 * A window that matches no preset (which a custom range would produce) simply
 * highlights nothing. That is why `value` is a window and not a preset key: the
 * type cannot express "some range that is not one of these five", and silently
 * highlighting the nearest chip would be a lie.
 */
export function PeriodFilter({
  value,
  onChange,
  allowAll = false,
}: {
  /** `null` means no period filter at all — only reachable when `allowAll`. */
  value: DateWindow | null
  onChange: (next: DateWindow | null) => void
  /**
   * Renders a leading "All dates" chip that clears the period.
   *
   * OFF by default, and that default is the important half. The dashboard and the
   * transactions ledger have always had a period, and their money queries cap at
   * `TOTALS_MAX_ROWS` — an unbounded window there is exactly what
   * `PERIOD_PRESETS` refuses. The bookings list is the opposite case: it has never
   * had a date filter, it is server-paged rather than totalled, and a drill-down
   * from "Pending Approvals" arrives carrying no period at all. So "no period" is
   * both its existing behaviour and a state it can be pushed into — and without a
   * way back, choosing "Today" there would be a one-way trip.
   */
  allowAll?: boolean
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  // Resolved ONCE per render and passed to both directions. Calling `phToday()`
  // separately inside each helper would let a render that straddles midnight match
  // a chip against one day and emit a window built from the next.
  const today = phToday()
  const active = value ? presetForWindow(value, today) : null

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Named and roled because the bookings screen stacks this strip directly
      // below the status strip (D6). Without it a screen-reader user meets eleven
      // undifferentiated tabs and has no way to tell which row does what.
      accessibilityRole="tablist"
      accessibilityLabel="Period"
      // Both `style` and `contentContainerStyle` are load-bearing and do different
      // jobs — see the styles file. Without `style`, RN's `flexGrow: 1` base style
      // stretches the whole strip.
      style={styles.container}
      contentContainerStyle={styles.scroll}
    >
      {/* Leading, so "no filter" reads as the widest option at the left-hand end
          rather than as a sixth narrowing. Selected when there is no window —
          which is also how a Pending drill-down arrives. */}
      {allowAll ? (
        <Pressable
          onPress={() => onChange(null)}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === null }}
          hitSlop={CHIP_HIT_SLOP}
          style={[styles.chip, value === null && styles.chipActive]}
        >
          {value === null ? (
            <LinearGradient
              colors={tokens.navActive.colors}
              start={tokens.navActive.start}
              end={tokens.navActive.end}
              style={styles.gradient}
            />
          ) : null}
          <Text
            style={[styles.label, value === null && styles.labelActive]}
            maxFontSizeMultiplier={1.3}
          >
            All dates
          </Text>
        </Pressable>
      ) : null}

      {PERIOD_PRESETS.map((preset) => {
        const selected = preset.value === active
        return (
          <Pressable
            key={preset.value}
            onPress={() => onChange(windowFor(preset.value, today))}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            // The visual chip is under MIN_TOUCH_TARGET by design; this restores
            // the real 44pt target. Do not "fix" it with a minHeight instead —
            // that would undo the sizing this strip shares with the status chips.
            hitSlop={CHIP_HIT_SLOP}
            style={[styles.chip, selected && styles.chipActive]}
          >
            {selected ? (
              <LinearGradient
                colors={tokens.navActive.colors}
                start={tokens.navActive.start}
                end={tokens.navActive.end}
                style={styles.gradient}
              />
            ) : null}
            {/* Capped for the same reason as the status chips: this chip is sized
                by padding rather than a minHeight floor, so an uncapped label at
                high OS font scale would grow the chip instead of just the text.
                12 x 1.3 = 16pt stays legible and the row scrolls, so nothing
                clips. `.plans/2026-07-31-vendor-mobile-filter-density.md` D1. */}
            <Text
              style={[styles.label, selected && styles.labelActive]}
              maxFontSizeMultiplier={1.3}
            >
              {preset.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
