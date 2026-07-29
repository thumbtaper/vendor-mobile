import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    button: {
      width: MIN_TOUCH_TARGET,
      height: MIN_TOUCH_TARGET,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.pillBg,
      borderWidth: 1,
      borderColor: t.pillBdr,
    },
    pressed: {
      opacity: 0.7,
    },
  })
