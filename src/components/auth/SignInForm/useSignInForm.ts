import { useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { useCallback, useState } from "react"

import { WEB_PORTAL_URL } from "@/lib/constants"
import { signIn } from "@/services/auth.service"

// Supabase returns deliberately vague auth errors. Mapping them keeps the UI from
// leaking whether an address is registered, while still telling a locked-out user
// something actionable.
function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials")) {
    return "That email or password is incorrect."
  }
  if (m.includes("email not confirmed")) {
    return "This account hasn't been confirmed yet. Check your email for the confirmation link."
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Can't reach the server. Check your connection and try again."
  }
  return message
}

export function useSignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting

  const submit = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    const { error: authError } = await signIn(email.trim(), password)

    if (authError) {
      setError(mapAuthError(authError.message))
      setSubmitting(false)
      return
    }
    // No navigation here: the root layout's guards react to the session change
    // and route to the gate's verdict. Navigating from the form as well would
    // race with that and can leave a dead screen in the history.
    setSubmitting(false)
  }, [canSubmit, email, password])

  const togglePassword = useCallback(() => setShowPassword((v) => !v), [])
  const goToForgotPassword = useCallback(
    () => router.push("/forgot-password"),
    [router],
  )

  // D7-A: registration is a 6-step KYC flow behind a service-role route handler,
  // so it stays on the web portal and this app never touches that surface.
  const openRegistration = useCallback(() => {
    if (WEB_PORTAL_URL) WebBrowser.openBrowserAsync(WEB_PORTAL_URL)
  }, [])

  return {
    canRegister: Boolean(WEB_PORTAL_URL),
    openRegistration,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePassword,
    error,
    submitting,
    canSubmit,
    submit,
    goToForgotPassword,
  }
}
