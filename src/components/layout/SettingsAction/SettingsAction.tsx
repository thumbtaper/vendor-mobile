import { useRouter } from "expo-router"
import { Settings } from "lucide-react-native"
import { useCallback, useMemo } from "react"
import { Pressable } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./SettingsAction.styles"

// Header action shared by every tab screen. Carries its own navigation handler,
// which is the only state-like concern it has.
export function SettingsAction() {
  const router = useRouter()
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const open = useCallback(() => router.push("/settings"), [router])

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel="Settings"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Settings size={20} color={tokens.strong} />
    </Pressable>
  )
}
