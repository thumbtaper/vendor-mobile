import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

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
      ...typeface.semibold,
      flex: 1,
      color: t.strong,
      fontSize: type.body.size,
    },
    titleRead: {
    ...typeface.regular,
    },
    message: {
      ...typeface.regular,
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
    time: {
      ...typeface.regular,
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
      ...typeface.bold,
      fontSize: type.caption.size,
      marginTop: 4,
    },
    archiveLabel: {
      color: "#3b82f6",
    },
    deleteLabel: {
      color: "#ef4444",
    },
  })
