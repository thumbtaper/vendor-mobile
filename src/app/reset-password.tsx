import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm/ResetPasswordForm"
import { AuthScreen } from "@/components/common/AuthScreen/AuthScreen"

// Deep-link target for the emailed reset link (I4). Deliberately NOT inside
// either auth guard in `_layout.tsx`: the recovery link creates a session, so a
// `!hasSession` guard would bounce the user off this screen the moment the code
// is exchanged, and a `hasSession` guard would block the error path where the
// link is expired and no session exists.
export default function ResetPasswordScreen() {
  return (
    <AuthScreen>
      <ResetPasswordForm />
    </AuthScreen>
  )
}
