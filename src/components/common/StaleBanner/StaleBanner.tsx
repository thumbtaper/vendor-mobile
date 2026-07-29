import { CloudOff } from "lucide-react-native"
import { useMemo } from "react"
import { Text, View } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./StaleBanner.styles"
import { useStaleBanner, type StaleBannerInput } from "./useStaleBanner"

// Distinguishing *offline with saved data* from a *server error* from an
// *expired session* is a hard requirement (plan §5.1) — collapsing them into one
// red toast hides the fact that the user's next action differs in each case.
// This banner covers only the first: data on screen is real but not current.
export function StaleBanner(props: StaleBannerInput) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const { visible, label } = useStaleBanner(props)

  if (!visible) return null

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <CloudOff size={16} color={tokens.strong} />
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}
