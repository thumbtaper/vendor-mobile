import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"
import { MIN_TOUCH_TARGET, spacing, type Tokens } from "@/theme/tokens"
export const makeStyles = (t: Tokens) => StyleSheet.create({
  frame: { flex: 1, minHeight: 0 },
  stepHeader: { gap: spacing.sm, paddingBottom: spacing.md },
  stepLabel: { ...typeface.semibold, color: t.text, fontSize: 13,},
  scroll: { flex: 1 },
  content: { gap: spacing.lg, paddingBottom: spacing.lg },
  heading: { ...typeface.bold, color: t.strong, fontSize: 22,},
  text: { ...typeface.regular, color: t.strong, fontSize: 15, lineHeight: 22 },
  muted: { ...typeface.regular, color: t.text, fontSize: 14, lineHeight: 21 },
  legalLinks: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.xs, marginTop: -spacing.sm },
  legalLink: { minHeight: MIN_TOUCH_TARGET, maxWidth: "100%", justifyContent: "center", paddingHorizontal: spacing.sm },
  legalLinkPressed: { opacity: 0.7 },
  legalLinkText: { ...typeface.semibold, color: t.accent, fontSize: 14, textDecorationLine: "underline" },
  actionBar: { borderTopWidth: 0, backgroundColor: "transparent", paddingTop: spacing.md },
})
