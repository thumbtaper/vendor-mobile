import { Eye, EyeOff } from "lucide-react-native"
import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"

import { FormField } from "@/components/common/FormField/FormField"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./SignInForm.styles"
import { useSignInForm } from "./useSignInForm"

export function SignInForm() {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const f = useSignInForm()

  return (
    <View style={styles.form}>
      <View style={styles.header}>
        <Text style={styles.heading}>Sign in</Text>
        <Text style={styles.subheading}>
          Manage your bookings and payouts on the go.
        </Text>
      </View>

      {f.error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText} accessibilityRole="alert">
            {f.error}
          </Text>
        </View>
      ) : null}

      <FormField
        label="Email"
        value={f.email}
        onChangeText={f.setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
      />

      <FormField
        label="Password"
        value={f.password}
        onChangeText={f.setPassword}
        placeholder="Your password"
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        secureTextEntry={!f.showPassword}
        returnKeyType="go"
        onSubmitEditing={f.submit}
        adornment={
          <Pressable
            onPress={f.togglePassword}
            accessibilityRole="button"
            accessibilityLabel={
              f.showPassword ? "Hide password" : "Show password"
            }
          >
            {f.showPassword ? (
              <EyeOff size={18} color={tokens.text} />
            ) : (
              <Eye size={18} color={tokens.text} />
            )}
          </Pressable>
        }
      />

      <PrimaryButton
        label="Sign in"
        onPress={f.submit}
        loading={f.submitting}
        disabled={!f.canSubmit}
      />

      <Pressable
        onPress={f.goToForgotPassword}
        accessibilityRole="link"
        style={styles.link}
      >
        <Text style={styles.linkText}>Forgot your password?</Text>
      </Pressable>

      {f.canRegister ? (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            New vendor? Registration and document verification happen on the web
            portal.
          </Text>
          <Pressable
            onPress={f.openRegistration}
            accessibilityRole="link"
            style={styles.link}
          >
            <Text style={styles.linkText}>Open the web portal</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}
