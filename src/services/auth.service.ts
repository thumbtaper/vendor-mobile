// Adapted from `vendor/services/auth.service.ts`. Same Supabase Auth calls; the
// differences are mobile-only: a deep-link redirect for password reset, and an
// explicit PKCE code exchange because there is no URL bar for the client to read
// a session out of.

import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getUser() {
  return supabase.auth.getUser()
}

export async function getSession() {
  return supabase.auth.getSession()
}

// `redirectTo` must be a deep link registered against this app's scheme AND
// allow-listed in the Supabase project's redirect URLs, or the emailed link
// silently lands on the web portal instead of opening the app (I4).
export async function resetPassword(email: string, redirectTo: string) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo })
}

// PKCE: the emailed link carries a `code`, which is exchanged for a session using
// the verifier this device stored when the reset was requested. That is why a
// reset link only works on the device that asked for it.
export async function exchangeCodeForSession(code: string) {
  return supabase.auth.exchangeCodeForSession(code)
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword })
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange(callback)
}
