import { StyleSheet } from "react-native"
import { MIN_TOUCH_TARGET, spacing, type Tokens } from "@/theme/tokens"
export const makeStyles = (t: Tokens) => StyleSheet.create({
  content: { gap: spacing.xl },
  document: { gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: t.divider },
  heading: { color: t.strong, fontSize: 20, fontWeight: "700" },
  text: { color: t.strong, fontSize: 15, lineHeight: 23, flexShrink: 1 },
  muted: { color: t.text, fontSize: 14 },
  check: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH_TARGET, gap: spacing.md, paddingVertical: spacing.sm },
})
