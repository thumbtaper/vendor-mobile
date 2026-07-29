import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

// A factory, not a module-level StyleSheet: a singleton would freeze one theme's
// colours at import time. The consuming hook/component memoises the result.
export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    wrapper: {
      gap: spacing.xs,
    },
    label: {
      color: t.text,
      fontSize: type.label.size,
      fontWeight: type.label.weight,
    },
    input: {
      minHeight: MIN_TOUCH_TARGET,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      borderWidth: 1,
      backgroundColor: t.inputBg,
      borderColor: t.inputBdr,
      color: t.inputColor,
      fontSize: type.body.size,
    },
    inputError: {
      borderColor: "#ef4444",
    },
    error: {
      color: "#ef4444",
      fontSize: type.caption.size,
    },
    // The visibility toggle sits inside the field, so it needs its own 44pt box
    // rather than inheriting the input's padding.
    adornment: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: MIN_TOUCH_TARGET,
      alignItems: "center",
      justifyContent: "center",
    },
    inputWithAdornment: {
      paddingRight: MIN_TOUCH_TARGET,
    },
    field: {
      position: "relative",
      justifyContent: "center",
    },
  })
