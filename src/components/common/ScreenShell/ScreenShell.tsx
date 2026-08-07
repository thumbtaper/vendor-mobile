import { LinearGradient } from "expo-linear-gradient"
import { useMemo } from "react"
import { View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ScreenTitleContext } from "@/components/common/ScreenTitle/ScreenTitleContext"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./ScreenShell.styles"

interface Props {
  title: string
  subtitle?: string | null
  /** Rendered in the pinned action row — e.g. the settings button. */
  action?: React.ReactNode
  children: React.ReactNode
}

/**
 * The page frame every tab screen sits in.
 *
 * Pure display. The page gradient reproduces `--sp-page-bg`, which has no RN
 * equivalent. `edges` omits "bottom" because the tab bar owns that inset —
 * applying it here as well double-pads every screen above the tab bar.
 *
 * **Only the action row is pinned (B1).** The title and subtitle are handed down
 * through `ScreenTitleContext` and rendered by `<ScreenTitle />` inside each
 * screen's own scroll container, so they scroll away with the content. Before
 * B1 this component pinned the title too, which — stacked with each screen's own
 * fixed toolbar, filter strip or summary cards — left Transactions with a list
 * viewport barely taller than one row.
 */
export function ScreenShell({ title, subtitle, action, children }: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  // Memoised on the two values it holds, not rebuilt each render — every screen's
  // scroll content sits under this provider, so a fresh object would invalidate
  // consumers on every parent render.
  const titleValue = useMemo(() => ({ title, subtitle }), [title, subtitle])

  return (
    <LinearGradient
      colors={tokens.pageBg.colors}
      start={tokens.pageBg.start}
      end={tokens.pageBg.end}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Rendered only when there is an action. Settings has none, and an empty
            pinned strip there would be dead space above content that already
            starts at the safe-area edge. */}
        {action ? <View style={styles.actionRow}>{action}</View> : null}
        <ScreenTitleContext.Provider value={titleValue}>
          <View style={styles.body}>{children}</View>
        </ScreenTitleContext.Provider>
      </SafeAreaView>
    </LinearGradient>
  )
}
