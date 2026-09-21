import { ArrowLeft } from "lucide-react-native"
import { Pressable } from "react-native"
import { useKioskBackButton } from "./useKioskBackButton"

interface KioskBackButtonProps {
  accessibilityLabel: string
  onPress: () => void
}

export function KioskBackButton({ accessibilityLabel, onPress }: KioskBackButtonProps) {
  const s = useKioskBackButton()
  return <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityHint="Returns to the previous kiosk step"
    style={({ pressed }) => [s.styles.button, pressed && s.styles.pressed]}
  >
    <ArrowLeft size={24} color={s.tokens.strong} accessible={false} />
  </Pressable>
}
