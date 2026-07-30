import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    row: {
      minHeight: MIN_TOUCH_TARGET + spacing.lg,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.card,
      borderWidth: 1,
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
      ...t.cardShadow,
    },
    pressed: {
      opacity: 0.75,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: radii.pill,
      backgroundColor: "#2563eb",
      marginTop: 6,
    },
    readSpacer: {
      width: 8,
    },
    body: {
      flex: 1,
      gap: 3,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    // Nudged down to sit on the title's baseline rather than its box top — the
    // web row does the same with `mt-0.5`.
    typeIcon: {
      marginTop: 2,
    },
    title: {
      flex: 1,
      color: t.strong,
      fontSize: type.body.size,
      fontWeight: "600",
    },
    titleRead: {
      fontWeight: "400",
    },
    message: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
    time: {
      color: t.text,
      fontSize: type.caption.size,
    },
    archiveButton: {
      width: MIN_TOUCH_TARGET,
      height: MIN_TOUCH_TARGET,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.md,
    },
    // Revealed behind the row while swiping.
    action: {
      justifyContent: "center",
      alignItems: "center",
      width: 88,
      marginVertical: 0,
      borderRadius: radii.card,
    },
    actionArchive: {
      backgroundColor: "rgba(59,130,246,0.15)",
    },
    actionDelete: {
      backgroundColor: "rgba(239,68,68,0.15)",
    },
    actionLabel: {
      fontSize: type.caption.size,
      fontWeight: "700",
      marginTop: 4,
    },
    archiveLabel: {
      color: "#3b82f6",
    },
    deleteLabel: {
      color: "#ef4444",
    },
  })
