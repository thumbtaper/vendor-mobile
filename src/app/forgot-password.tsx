import { useRouter } from "expo-router"
import { useCallback } from "react"

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm/ForgotPasswordForm"
import { AuthScreen } from "@/components/common/AuthScreen/AuthScreen"

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace("/sign-in")
  }, [router])

  return (
    <AuthScreen>
      <ForgotPasswordForm onDone={goBack} />
    </AuthScreen>
  )
}
