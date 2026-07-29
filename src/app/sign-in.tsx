import { AuthScreen } from "@/components/common/AuthScreen/AuthScreen"
import { SignInForm } from "@/components/auth/SignInForm/SignInForm"

// Route files stay pure composition: no state, no styling. A co-located
// `.styles.ts` under `app/` would be picked up by expo-router as a route.
export default function SignInScreen() {
  return (
    <AuthScreen>
      <SignInForm />
    </AuthScreen>
  )
}
