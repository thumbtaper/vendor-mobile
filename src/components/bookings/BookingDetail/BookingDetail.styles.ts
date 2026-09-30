import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // `paddingBottom` is applied INLINE from `useBookingDetail`'s `bottomInset`,
    // not here — it depends on the device's safe-area inset. Do not add a static
    // one: `space-between` pins the action bar to the bottom edge, and the tab
    // bar floats over that edge (B1).
    wrapper: {
      flex: 1,
      justifyContent: "space-between",
    },
    scroll: {
      padding: spacing.xl,
      gap: spacing.lg,
    },
    backLink: {
      alignSelf: "flex-start",
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    backLinkPressed: {
      opacity: 0.75,
    },
    backLinkLabel: {
      ...typeface.semibold,
      color: t.accent,
      fontSize: type.body.size,
    },
    centred: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xxl,
      gap: spacing.md,
    },
    card: {
      gap: spacing.md,
      padding: spacing.xl,
      borderRadius: radii.card,
      borderWidth: 1,
      backgroundColor: t.cardBg,
      borderColor: t.cardBdr,
      ...t.cardShadow,
    },
    headline: {
      ...typeface.bold,
      color: t.strong,
      fontSize: type.title.size,
    },
    badge: {
      ...typeface.bold,
      alignSelf: "flex-start",
      fontSize: type.caption.size,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radii.pill,
      overflow: "hidden",
    },
    field: {
      gap: 2,
    },
    label: {
      ...typeface.semibold,
      color: t.text,
      fontSize: type.caption.size,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    value: {
      ...typeface.regular,
      color: t.strong,
      fontSize: type.body.size,
      lineHeight: 21,
    },
    price: {
      ...typeface.bold,
      color: t.strong,
      fontSize: type.stat.size,
    },
    message: {
      ...typeface.regular,
      color: t.text,
      fontSize: type.body.size,
      textAlign: "center",
    },
  })
