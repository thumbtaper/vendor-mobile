import { LinearGradient } from "expo-linear-gradient"
import { useMemo } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { APP_NAME } from "@/lib/constants"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./AuthScreen.styles"

// Pure display shell for the pre-app screens. Reproduces the web's `--sp-page-bg`
// gradient, which has no RN equivalent, and handles the two things every mobile
// form gets wrong: the keyboard covering the submit button, and content sitting
// under a notch or gesture bar.
export function AuthScreen({
  children,
  showBrand = true,
}: {
  children: React.ReactNode
  showBrand?: boolean
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <LinearGradient
      colors={tokens.pageBg.colors}
      start={tokens.pageBg.start}
      end={tokens.pageBg.end}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {showBrand ? (
              <View style={styles.brandRow}>
                <Text style={styles.brand}>{APP_NAME}</Text>
              </View>
            ) : null}
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}
