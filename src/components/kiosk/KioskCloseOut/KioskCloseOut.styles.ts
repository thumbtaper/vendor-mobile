import { StyleSheet } from "react-native"
import { MIN_TOUCH_TARGET, radii, spacing, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) => StyleSheet.create({
  frame: { flex: 1, minHeight: 0 },
  stepHeader: { gap: spacing.sm, paddingBottom: spacing.md },
  stepLabel: { color: t.text, fontSize: 13, fontWeight: "600" },
  scroll: { flex: 1 },
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  heading: { color: t.strong, fontSize: 22, fontWeight: "700" },
  text: { color: t.strong, fontSize: 15, lineHeight: 22, flexShrink: 1 },
  muted: { color: t.text, fontSize: 14, lineHeight: 21 },
  error: { color: t.status.disputed.fg, fontSize: 15, lineHeight: 22 },
  done: { color: t.status.confirmed.fg, fontSize: 15, lineHeight: 22 },
  match: { borderWidth: 1, borderColor: t.cardBdr, borderRadius: radii.md, padding: spacing.lg, gap: spacing.md, backgroundColor: t.cardBg },
  matchMeta: { gap: spacing.xs },
  matchName: { color: t.strong, fontSize: 16, fontWeight: "700" },
  statusTag: { color: t.text, fontSize: 13, fontWeight: "600" },
  matchSub: { color: t.text, fontSize: 14 },
  matchMessage: { color: t.text, fontSize: 14, lineHeight: 21 },
  action: { minHeight: MIN_TOUCH_TARGET },
  actionBar: { borderTopWidth: 1, borderTopColor: t.divider, backgroundColor: t.modalBg, paddingTop: spacing.md },
})
