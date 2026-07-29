import { useMemo } from "react"
import { Text, View } from "react-native"

import { FormField } from "@/components/common/FormField/FormField"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./ForgotPasswordForm.styles"
import { useForgotPasswordForm } from "./useForgotPasswordForm"

export function ForgotPasswordForm({ onDone }: { onDone: () => void }) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const f = useForgotPasswordForm()

  if (f.sent) {
    return (
      <View style={styles.form}>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Check your email</Text>
          <Text style={styles.noticeBody}>
            If an account exists for {f.email.trim()}, we&apos;ve sent a link to
            reset your password. Open it on this device — the link only works on
            the phone that requested it.
          </Text>
        </View>
        <PrimaryButton label="Back to sign in" onPress={onDone} variant="secondary" />
      </View>
    )
  }

  return (
    <View style={styles.form}>
      <View style={styles.header}>
        <Text style={styles.heading}>Reset your password</Text>
        <Text style={styles.subheading}>
          Enter the email you sign in with and we&apos;ll send you a reset link.
        </Text>
      </View>

      {f.error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {f.error}
        </Text>
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
        returnKeyType="go"
        onSubmitEditing={f.submit}
      />

      <PrimaryButton
        label="Send reset link"
        onPress={f.submit}
        loading={f.submitting}
        disabled={!f.canSubmit}
      />
      <PrimaryButton label="Cancel" onPress={onDone} variant="secondary" />
    </View>
  )
}
