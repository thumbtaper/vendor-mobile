import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheetWrap: {
      maxHeight: "76%",
    },
    sheet: {
      flexShrink: 1,
      gap: spacing.lg,
      padding: spacing.xl,
      borderTopLeftRadius: radii.card,
      borderTopRightRadius: radii.card,
      borderTopWidth: 1,
      borderColor: t.panelBdr,
      backgroundColor: t.modalBg,
    },
    grabber: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: radii.pill,
      backgroundColor: t.toggleOff,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    headerText: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      color: t.strong,
      fontSize: type.title.size,
      fontWeight: type.title.weight,
    },
    subtitle: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
    closeButton: {
      minWidth: MIN_TOUCH_TARGET,
      minHeight: MIN_TOUCH_TARGET,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: t.pillBdr,
      backgroundColor: t.pillBg,
      flexShrink: 0,
    },
    closePressed: {
      opacity: 0.7,
    },
    scroll: {
      flexShrink: 1,
    },
    optionList: {
      overflow: "hidden",
      borderRadius: radii.card,
      borderWidth: 1,
      borderColor: t.cardBdr,
      backgroundColor: t.cardBg,
    },
    option: {
      minHeight: MIN_TOUCH_TARGET + spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    optionDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.divider,
    },
    optionPressed: {
      backgroundColor: t.overlaySubtle,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: radii.pill,
      borderWidth: 2,
      borderColor: t.toggleOff,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    radioSelected: {
      borderColor: t.accent,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: radii.pill,
      backgroundColor: t.accent,
    },
    optionText: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      color: t.strong,
      fontSize: type.body.size,
      fontWeight: "600",
    },
    optionMeta: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
    badge: {
      minWidth: 20,
      overflow: "hidden",
      borderRadius: radii.pill,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      textAlign: "center",
      color: "#ffffff",
      backgroundColor: "#ef4444",
      fontSize: 10,
      fontWeight: "800",
      flexShrink: 0,
    },
  })
