import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    host: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingLeft: spacing.lg,
      paddingRight: spacing.sm,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      borderWidth: 1,
      backgroundColor: t.panelBg,
      borderColor: t.panelBdr,
      ...t.panelShadow,
    },
    message: {
      flex: 1,
      color: t.strong,
      fontSize: type.body.size,
    },
    action: {
      minHeight: MIN_TOUCH_TARGET,
      minWidth: MIN_TOUCH_TARGET,
      paddingHorizontal: spacing.md,
      alignItems: "center",
      justifyContent: "center",
    },
    actionLabel: {
      color: "#3b82f6",
      fontSize: type.body.size,
      fontWeight: "700",
    },
    error: {
      borderColor: "rgba(239,68,68,0.4)",
    },
  })
