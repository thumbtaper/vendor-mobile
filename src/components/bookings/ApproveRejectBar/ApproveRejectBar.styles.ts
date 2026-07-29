import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.divider,
      backgroundColor: t.cardBg,
    },
    // 44pt minimum, not the web's ~24pt buttons (plan §5.3). Porting those sizes
    // is the single most likely accessibility failure in this app.
    button: {
      flex: 1,
      minHeight: MIN_TOUCH_TARGET,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.md,
      borderWidth: 1,
    },
    approve: {
      backgroundColor: "rgba(16,185,129,0.12)",
      borderColor: "rgba(16,185,129,0.3)",
    },
    approveLabel: {
      color: "#10b981",
      fontSize: type.body.size,
      fontWeight: "700",
    },
    reject: {
      backgroundColor: "rgba(239,68,68,0.08)",
      borderColor: "rgba(239,68,68,0.2)",
    },
    rejectLabel: {
      color: "#ef4444",
      fontSize: type.body.size,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.7,
    },
    resolved: {
      padding: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.divider,
      gap: spacing.xs,
    },
    resolvedText: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
  })
