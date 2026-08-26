import { StyleSheet } from "react-native"

import {
  MIN_TOUCH_TARGET,
  radii,
  spacing,
  type,
  type Tokens,
} from "@/theme/tokens"

const CHIP_SIZE = 34

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    surface: {
      flex: 1,
      backgroundColor: t.modalBg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.divider,
      backgroundColor: t.heroBg.colors[0],
    },
    headerText: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      flex: 1,
    },
    headerChip: {
      width: CHIP_SIZE,
      height: CHIP_SIZE,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.btnPrimary.colors[0],
      flexShrink: 0,
    },
    headerCopy: {
      flex: 1,
      gap: 2,
    },
    headerTitle: {
      color: t.strong,
      fontSize: type.title.size,
      fontWeight: type.title.weight,
    },
    headerSubtitle: {
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
      backgroundColor: t.overlaySubtle,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.xl,
      gap: spacing.lg,
    },
    item: {
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: t.cardBdr,
      backgroundColor: t.subBg,
      borderLeftWidth: 3,
    },
    itemChip: {
      width: 30,
      height: 30,
      borderRadius: radii.sm,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      flexShrink: 0,
    },
    itemText: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      color: t.strong,
      fontSize: type.label.size,
      fontWeight: "700",
    },
    itemBody: {
      color: t.text,
      fontSize: type.body.size,
      lineHeight: 21,
    },
    actions: {
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    actionLabel: {
      color: t.strong,
      fontSize: type.caption.size,
      fontWeight: "700",
    },
    actionMeaning: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
    tipTitle: {
      fontSize: type.label.size,
      fontWeight: "700",
    },
    footnote: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
      paddingHorizontal: spacing.md,
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.divider,
      backgroundColor: t.modalBg,
    },
  })
