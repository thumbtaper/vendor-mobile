import { StyleSheet } from "react-native"
import { MIN_TOUCH_TARGET, radii, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) => StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: t.inputBdr,
    borderRadius: radii.md,
    backgroundColor: t.cardBg,
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
  },
  pressed: { opacity: 0.7 },
})
