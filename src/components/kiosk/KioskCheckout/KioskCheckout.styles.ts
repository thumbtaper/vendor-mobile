import { StyleSheet } from "react-native"
import { spacing, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) => StyleSheet.create({
  frame: { flex: 1, minHeight: 0 },
  stepHeader: { gap: spacing.sm, paddingBottom: spacing.md },
  stepLabel: { color: t.text, fontSize: 13, fontWeight: "600" },
  scroll: { flex: 1 },
  content: { gap: spacing.lg, paddingBottom: spacing.lg },
  heading: { color: t.strong, fontSize: 22, fontWeight: "700" },
  text: { color: t.strong, fontSize: 15, lineHeight: 22 },
  muted: { color: t.text, fontSize: 14, lineHeight: 21 },
  creating: { minHeight: 300, alignItems: "center", justifyContent: "center", gap: spacing.lg },
  creatingLogo: { width: 84, height: 84, borderRadius: 18 },
  creatingText: { color: t.strong, fontSize: 16, fontWeight: "600" },
  amount: { color: t.strong, fontSize: 24, fontWeight: "700" },
  confirmation: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl },
  confirmationTitle: { color: t.strong, fontSize: 24, fontWeight: "700", textAlign: "center" },
  signature: { width: "100%", aspectRatio: 2, borderRadius: 8 },
  actionBar: { borderTopWidth: 1, borderTopColor: t.divider, backgroundColor: t.modalBg, paddingTop: spacing.md, gap: spacing.sm },
})
