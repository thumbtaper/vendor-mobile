import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

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
      ...typeface.bold,
      color: t.strong,
      fontSize: type.label.size,
    },
    link: {
      minHeight: MIN_TOUCH_TARGET,
      justifyContent: "center",
    },
    linkLabel: {
      ...typeface.bold,
      color: "#2563eb",
      fontSize: type.caption.size,
    },
    previewList: {
      gap: spacing.md,
    },
    emptyText: {
      ...typeface.regular,
      color: t.text,
      fontSize: type.body.size,
      lineHeight: 21,
    },
    errorText: {
      ...typeface.regular,
      color: "#ef4444",
      fontSize: type.body.size,
    },
    // The `warning` style went with the standalone truncation notice it dressed —
    // that message now lives in the Earnings section caption (I2), which has its
    // own style in `DashboardSection.styles.ts`.
  })
