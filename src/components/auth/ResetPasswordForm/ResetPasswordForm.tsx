import { Eye, EyeOff } from "lucide-react-native"
import { useMemo } from "react"
import { ActivityIndicator, Pressable, Text, View } from "react-native"

import { FormField } from "@/components/common/FormField/FormField"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./ResetPasswordForm.styles"
import { useResetPasswordForm } from "./useResetPasswordForm"

export function ResetPasswordForm() {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const f = useResetPasswordForm()

  if (f.exchange === "exchanging") {
    return (
      <View style={styles.centred}>
        <ActivityIndicator color={tokens.strong} />
        <Text style={styles.subheading}>Checking your reset link…</Text>
      </View>
    )
  }

  if (f.exchange === "invalid") {
    return (
      <View style={styles.form}>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>This link didn&apos;t work</Text>
          <Text style={styles.noticeBody}>{f.linkError}</Text>
        </View>
        <PrimaryButton label="Back to sign in" onPress={f.goToSignIn} />
      </View>
    )
  }

  if (f.done) {
    return (
      <View style={styles.form}>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Password updated</Text>
          <Text style={styles.noticeBody}>
            Sign in with your new password to continue.
          </Text>
        </View>
        <PrimaryButton label="Sign in" onPress={f.goToSignIn} />
      </View>
    )
  }

  return (
    <View style={styles.form}>
      <View style={styles.header}>
        <Text style={styles.heading}>Choose a new password</Text>
        <Text style={styles.noticeBody}>
          Use at least 8 characters.
        </Text>
      </View>

      {f.error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {f.error}
        </Text>
      ) : null}

      <FormField
        label="New password"
        value={f.password}
        onChangeText={f.setPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        secureTextEntry={!f.showPassword}
        error={f.validation}
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

      <FormField
        label="Confirm new password"
        value={f.confirm}
        onChangeText={f.setConfirm}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        secureTextEntry={!f.showPassword}
        returnKeyType="go"
        onSubmitEditing={f.submit}
      />

      <PrimaryButton
        label="Update password"
        onPress={f.submit}
        loading={f.submitting}
        disabled={!f.canSubmit}
      />
    </View>
  )
}
