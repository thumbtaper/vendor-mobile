import { useEffect } from "react"

// State, effects and handlers for AppErrorBoundary, keeping the render layer
// pure (root AGENTS.md → Component Conventions).
//
// There is no crash-reporting SDK in this app — no Sentry, no Crashlytics — so
// the device log is the ONLY record that a render crash happened. `console.error`
// reaches `adb logcat` on Android and the Xcode console on iOS, which is exactly
// where someone debugging a release build will look. That is why this logs
// unconditionally rather than behind `__DEV__`: in development the error is
// already visible on screen, and it is the release build that has nothing else.
export function useAppErrorBoundary(error: Error): { detail: string | null } {
  useEffect(() => {
    // Keyed on `error` so a retry that fails again logs the second failure too,
    // while a re-render for any other reason does not duplicate the first.
    console.error("[error-boundary] render crash:", error?.message, error?.stack)
  }, [error])

  return {
    // Shown in development, withheld in release. The app renders booker PII and
    // payout figures, and an error message can carry either into a screenshot a
    // vendor sends to support. The log above keeps it available to us without
    // putting it on their screen.
    detail: __DEV__ ? (error?.message ?? null) : null,
  }
}
