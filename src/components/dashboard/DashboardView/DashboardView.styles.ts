import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // `paddingBottom` is applied INLINE from `useDashboardView`'s
    // `contentBottomPadding` — it depends on the device's safe-area inset, which a
    // static stylesheet cannot see. Do not reinstate one here: the tab bar is
    // `position: "absolute"` and floats over this content (I3).
    content: {
      padding: spacing.xl,
      gap: spacing.lg,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.sm,
    },
    sectionTitle: {
      color: t.strong,
      fontSize: type.label.size,
      fontWeight: "700",
    },
    link: {
      minHeight: MIN_TOUCH_TARGET,
      justifyContent: "center",
    },
    linkLabel: {
      color: "#2563eb",
      fontSize: type.caption.size,
      fontWeight: "700",
    },
    previewList: {
      gap: spacing.md,
    },
    emptyText: {
      color: t.text,
      fontSize: type.body.size,
      lineHeight: 21,
    },
    errorText: {
      color: "#ef4444",
      fontSize: type.body.size,
    },
  })
