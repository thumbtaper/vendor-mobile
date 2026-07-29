import { LinearGradient } from "expo-linear-gradient"
import { useMemo } from "react"
import { Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./ScreenShell.styles"

interface Props {
  title: string
  subtitle?: string | null
  /** Rendered on the trailing edge of the header — e.g. a settings button. */
  action?: React.ReactNode
  children: React.ReactNode
}

// Pure display. The page gradient reproduces `--sp-page-bg`, which has no RN
// equivalent. `edges` omits "bottom" because the tab bar owns that inset —
// applying it here as well double-pads every screen above the tab bar.
export function ScreenShell({ title, subtitle, action, children }: Props) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <LinearGradient
      colors={tokens.pageBg.colors}
      start={tokens.pageBg.start}
      end={tokens.pageBg.end}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {action}
        </View>
        <View style={styles.body}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  )
}
