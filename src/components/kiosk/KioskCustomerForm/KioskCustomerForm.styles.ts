import { StyleSheet } from "react-native"
import { MIN_TOUCH_TARGET, spacing, type Tokens } from "@/theme/tokens"
export const makeStyles = (t: Tokens) => StyleSheet.create({
  frame: { flex: 1, minHeight: 0 },
  stepHeader: { gap: spacing.sm, paddingBottom: spacing.md },
  stepLabel: { color: t.text, fontSize: 13, fontWeight: "600" },
  scroll: { flex: 1 },
  content: { gap: spacing.lg, paddingBottom: spacing.lg },
  heading: { color: t.strong, fontSize: 22, fontWeight: "700" },
  text: { color: t.strong, fontSize: 15, lineHeight: 22 },
  muted: { color: t.text, fontSize: 14, lineHeight: 21 },
  legalLinks: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.xs, marginTop: -spacing.sm },
  legalLink: { minHeight: MIN_TOUCH_TARGET, maxWidth: "100%", justifyContent: "center", paddingHorizontal: spacing.sm },
  legalLinkPressed: { opacity: 0.7 },
  legalLinkText: { color: t.accent, fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
  actionBar: { borderTopWidth: 1, borderTopColor: t.divider, backgroundColor: t.modalBg, paddingTop: spacing.md },
})
