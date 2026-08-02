import { LinearGradient } from "expo-linear-gradient"
import { StatusBar } from "expo-status-bar"
import { useMemo } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg"

import { APP_NAME } from "@/lib/constants"
import { AppThemeContext } from "@/theme/useAppTheme"
import { makeStyles } from "./AuthScreen.styles"
import { useAuthScreen } from "./useAuthScreen"

// Branded shell for the pre-app screens, matching the vendor web login
// (`vendor/components/auth/LoginPage`): a hardcoded-dark navy page with gold
// accents, a 3px gold top edge on the form shell, and two radial washes.
//
// It provides `AppThemeContext` so the whole subtree — FormField, PrimaryButton,
// VendorPicker, the three auth forms, BlockedNotice — picks up the brand palette
// without any of them being edited (D3-A). All six pre-app routes come through
// here: sign-in, forgot-password, reset-password, select-vendor, blocked, and the
// index anchor's loading state.
//
// Still handles the two things every mobile form gets wrong: the keyboard covering
// the submit button, and content sitting under a notch or gesture bar.
export function AuthScreen({
  children,
  showBrand = true,
}: {
  children: React.ReactNode
  showBrand?: boolean
}) {
  const theme = useAuthScreen()
  const styles = useMemo(() => makeStyles(theme.tokens), [theme.tokens])

  return (
    <AppThemeContext.Provider value={theme}>
      {/* This surface is dark whatever the device theme is, so the status-bar
          glyphs must be forced light — on a light-mode device the OS would draw
          them dark, i.e. invisible against the navy. */}
      <StatusBar style="light" />
      <LinearGradient
        colors={theme.tokens.pageBg.colors}
        start={theme.tokens.pageBg.start}
        end={theme.tokens.pageBg.end}
        style={styles.gradient}
      >
        {/* Decorative, behind everything, and non-interactive so they cannot
            swallow a tap meant for the form. */}
        <Svg style={styles.blob1} pointerEvents="none" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="authBlobBlue" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#1a3a8f" stopOpacity={0.35} />
              <Stop offset="1" stopColor="#1a3a8f" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill="url(#authBlobBlue)" />
        </Svg>
        <Svg style={styles.blob2} pointerEvents="none" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="authBlobGold" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFC200" stopOpacity={0.08} />
              <Stop offset="1" stopColor="#FFC200" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill="url(#authBlobGold)" />
        </Svg>

        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          {/* One keyboard mechanism per platform, deliberately not shared.
              Stacking both would double-compensate and push the form off-screen
              in the other direction.

              ANDROID — `behavior="height"`. It previously passed `undefined`,
              which leaves this component doing NOTHING and relies entirely on the
              window resizing under `adjustResize`. That is the reported bug: with
              no compensation here, the keyboard simply draws over the password
              field. "height" resizes the view to the space above the keyboard and
              works whether or not the window itself resizes.

              iOS — `automaticallyAdjustKeyboardInsets` on the ScrollView below,
              so this stays `undefined` here. That prop is iOS-only and a no-op
              elsewhere, which is why it is set unconditionally. */}
          <KeyboardAvoidingView
            style={styles.keyboard}
            behavior={Platform.OS === "android" ? "height" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              // Scrolls the FOCUSED INPUT into view rather than padding the whole
              // container — the behaviour a login form actually wants. Replaces
              // the previous iOS `behavior="padding"`, which also double-counted
              // the home-indicator inset already consumed by the SafeAreaView's
              // `bottom` edge above.
              automaticallyAdjustKeyboardInsets
            >
              <View style={styles.shell}>
                {showBrand ? (
                  <View style={styles.brandRow}>
                    <Text style={styles.brand} accessibilityRole="header">
                      {APP_NAME}
                    </Text>
                    <Text style={styles.brandSub}>Vendor Portal</Text>
                  </View>
                ) : null}
                {children}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </AppThemeContext.Provider>
  )
}
