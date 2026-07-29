import { LinearGradient } from "expo-linear-gradient"
import { TriangleAlert } from "lucide-react-native"
import { useMemo } from "react"
import { Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./ConfigErrorScreen.styles"
import { useConfigErrorScreen } from "./useConfigErrorScreen"

interface Props {
  /** Names of the `EXPO_PUBLIC_*` variables the build was compiled without. */
  missing: string[]
}

// Shown in place of the entire app when required configuration is absent from
// the bundle. It replaces a module-scope `throw`, which surfaced as a red box in
// development and as a *silent process death* in release builds — splash, then
// nothing, with no way to tell a configuration mistake from a code crash.
//
// Rendered inside `AppThemeProvider` but above every provider that issues a
// request, so no Supabase call is ever made with placeholder credentials.
export function ConfigErrorScreen({ missing }: Props) {
  useConfigErrorScreen()
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <LinearGradient
      colors={tokens.pageBg.colors}
      start={tokens.pageBg.start}
      end={tokens.pageBg.end}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <View style={styles.iconRing}>
            <TriangleAlert size={28} color={tokens.strong} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            This build isn&apos;t configured
          </Text>
          <Text style={styles.body}>
            The app was built without the values it needs to reach its server.
            This cannot be fixed on the device — the build has to be repeated
            with the settings below in place.
          </Text>
          <View style={styles.list} accessibilityLabel="Missing configuration">
            {missing.map((name) => (
              <View key={name} style={styles.listItem}>
                <Text style={styles.listItemText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}
