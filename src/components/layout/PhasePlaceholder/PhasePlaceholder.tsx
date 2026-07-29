import { useMemo } from "react"
import { Text, View } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./PhasePlaceholder.styles"

// Temporary content for tabs whose phase has not been built yet. Exists so the
// navigation shell is verifiable on a device now, rather than only once every
// screen behind it is finished. Each use is deleted by the phase that fills it.
export function PhasePlaceholder({ phase, what }: { phase: string; what: string }) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.title}>{what}</Text>
        <Text style={styles.body}>Arrives in {phase}.</Text>
      </View>
    </View>
  )
}
