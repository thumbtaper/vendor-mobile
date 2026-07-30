import { useMemo } from "react"

import { brandTokens } from "@/theme/brandTokens"
import { useAppTheme, type AppTheme } from "@/theme/useAppTheme"

// Builds the theme context the auth subtree runs under. `tokens` and `isDark` are
// forced to the branded dark palette (D3-A); `preference` and `setPreference` are
// passed straight through from the real provider, so nothing in the subtree loses
// the ability to read or change the user's actual setting.
//
// Overriding the context rather than threading a `variant` prop through FormField,
// PrimaryButton, VendorPicker and the three auth forms is what keeps I3 a small
// change: those components already resolve every colour through `useAppTheme()`.
export function useAuthScreen(): AppTheme {
  const { preference, setPreference } = useAppTheme()

  return useMemo(
    () => ({
      tokens: brandTokens,
      isDark: true,
      preference,
      setPreference,
    }),
    [preference, setPreference],
  )
}
