import * as Linking from "expo-linking"
import { useCallback, useState } from "react"

import { resetPassword } from "@/services/auth.service"

export function useForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = email.trim().length > 0 && !submitting

  const submit = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    // Built from the app scheme rather than hard-coded, so it stays correct in
    // Expo Go (exp://…), a dev build, and a store build. This exact URL must be
    // allow-listed in the Supabase project's redirect URLs (I4).
    const redirectTo = Linking.createURL("/reset-password")

    const { error: authError } = await resetPassword(email.trim(), redirectTo)

    if (authError) {
      setError(authError.message)
      setSubmitting(false)
      return
    }

    // Always report success, even for an unknown address — telling the user which
    // emails exist is an account-enumeration leak.
    setSent(true)
    setSubmitting(false)
  }, [canSubmit, email])

  return { email, setEmail, sent, error, submitting, canSubmit, submit }
}
