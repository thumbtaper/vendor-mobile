import { useContext, useMemo } from "react"
import { Text, View } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./ScreenTitle.styles"
import { ScreenTitleContext } from "./ScreenTitleContext"

/**
 * A screen's title and subtitle, rendered wherever the screen's scroll content
 * begins.
 *
 * Used to live in `ScreenShell`'s fixed header. B1 moved it here so it scrolls
 * away with everything else, leaving only the action row pinned — the title is
 * not a menu, and on a phone it was costing a line of content on every screen.
 *
 * Pure display: no state, no handlers, so no companion hook. The value comes from
 * `ScreenTitleContext`, which `ScreenShell` provides.
 */
export function ScreenTitle() {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const value = useContext(ScreenTitleContext)

  if (!value) return null

  return (
    <View style={styles.group}>
      <Text style={styles.title} accessibilityRole="header">
        {value.title}
      </Text>
      {value.subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {value.subtitle}
        </Text>
      ) : null}
    </View>
  )
}
