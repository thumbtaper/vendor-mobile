import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"

import {
  exchangeCodeForSession,
  signOut,
  updatePassword,
} from "@/services/auth.service"

const MIN_PASSWORD_LENGTH = 8

type ExchangeState = "exchanging" | "ready" | "invalid"

export function useResetPasswordForm() {
  const router = useRouter()
  // Supabase PKCE sends `?code=`; an expired or already-used link sends
  // `?error_description=` instead, which must be shown rather than swallowed.
  const params = useLocalSearchParams<{
    code?: string
    error_description?: string
  }>()

  const [exchange, setExchange] = useState<ExchangeState>("exchanging")
  const [linkError, setLinkError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (params.error_description) {
        setLinkError(params.error_description)
        setExchange("invalid")
        return
      }
      if (!params.code) {
        setLinkError(
          "This reset link is missing its code. Request a new link and open it on this device.",
        )
        setExchange("invalid")
        return
      }

      const { error: exchangeError } = await exchangeCodeForSession(params.code)
      if (cancelled) return

      if (exchangeError) {
        setLinkError(
          "This reset link has expired or was already used. Request a new one.",
        )
        setExchange("invalid")
        return
      }
      setExchange("ready")
    }

    run()
    return () => {
      cancelled = true
    }
  }, [params.code, params.error_description])

  const validation =
    password.length === 0
      ? null
      : password.length < MIN_PASSWORD_LENGTH
        ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
        : confirm.length > 0 && confirm !== password
          ? "Both passwords must match."
          : null

  const canSubmit =
    exchange === "ready" &&
    password.length >= MIN_PASSWORD_LENGTH &&
    confirm === password &&
    !submitting

  const submit = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    // Sign out after a successful reset so the new password is actually used to
    // sign in, rather than the user continuing on the recovery session. It also
    // invalidates the recovery link's session on this device.
    await signOut()
    setDone(true)
    setSubmitting(false)
  }, [canSubmit, password])

  // To `/`, not `/sign-in`: that screen sits behind a `!signedIn` guard, so a
  // REPLACE onto it is dropped whenever a session exists — which the invalid
  // branch can reach, when a reset link fails to exchange on a device that is
  // already signed in. `index` is unguarded and routes to the right place in
  // every state.
  const goToSignIn = useCallback(() => router.replace("/"), [router])
  const togglePassword = useCallback(() => setShowPassword((v) => !v), [])

  return {
    exchange,
    linkError,
    password,
    setPassword,
    confirm,
    setConfirm,
    showPassword,
    togglePassword,
    validation,
    error,
    submitting,
    canSubmit,
    submit,
    done,
    goToSignIn,
  }
}
