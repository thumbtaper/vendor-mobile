import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"
import { MIN_TOUCH_TARGET, spacing, type Tokens } from "@/theme/tokens"
export const makeStyles = (t: Tokens) => StyleSheet.create({
  content: { gap: spacing.xl },
  document: { gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: t.divider },
  heading: { ...typeface.bold, color: t.strong, fontSize: 20,},
  text: { ...typeface.regular, color: t.strong, fontSize: 15, lineHeight: 23, flexShrink: 1 },
  muted: { ...typeface.regular, color: t.text, fontSize: 14 },
  check: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH_TARGET, gap: spacing.md, paddingVertical: spacing.sm },
})
