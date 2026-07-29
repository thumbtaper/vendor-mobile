import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      backgroundColor: t.inputBg,
      borderColor: t.inputBdr,
    },
    input: {
      flex: 1,
      minHeight: MIN_TOUCH_TARGET,
      color: t.inputColor,
      fontSize: type.body.size,
    },
    clear: {
      width: MIN_TOUCH_TARGET,
      height: MIN_TOUCH_TARGET,
      alignItems: "center",
      justifyContent: "center",
    },
  })
