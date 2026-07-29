import { BlurView } from "expo-blur"
import { useMemo } from "react"
import { View } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./TabBarBackground.styles"

// The web's `.sp-tabbar` is a translucent background plus `backdrop-filter:
// blur(24px)`. RN has no backdrop-filter, so the blur is a real view behind the
// bar (plan §5.4). Pure display, no state.
export function TabBarBackground() {
  const { tokens, isDark } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <View style={styles.fill}>
      <BlurView
        intensity={24}
        tint={isDark ? "dark" : "light"}
        style={styles.fill}
      />
      <View style={styles.tint} />
    </View>
  )
}
