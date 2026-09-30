import { StyleSheet } from "react-native"
import { typeface } from "@/theme/tokens"
import { MIN_TOUCH_TARGET, radii, spacing, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) => StyleSheet.create({
  frame: { flex: 1, minHeight: 0 },
  stepHeader: { gap: spacing.sm, paddingBottom: spacing.md },
  stepLabel: { ...typeface.semibold, color: t.text, fontSize: 13,},
  scroll: { flex: 1 },
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  heading: { ...typeface.bold, color: t.strong, fontSize: 22,},
  text: { ...typeface.regular, color: t.strong, fontSize: 15, lineHeight: 22, flexShrink: 1 },
  muted: { ...typeface.regular, color: t.text, fontSize: 14, lineHeight: 21 },
  error: { ...typeface.regular, color: t.status.disputed.fg, fontSize: 15, lineHeight: 22 },
  done: { ...typeface.regular, color: t.status.confirmed.fg, fontSize: 15, lineHeight: 22 },
  match: { borderWidth: 1, borderColor: t.cardBdr, borderRadius: radii.md, padding: spacing.lg, gap: spacing.md, backgroundColor: t.cardBg },
  matchMeta: { gap: spacing.xs },
  matchName: { ...typeface.bold, color: t.strong, fontSize: 16,},
  statusTag: { ...typeface.semibold, color: t.text, fontSize: 13,},
  matchSub: { ...typeface.regular, color: t.text, fontSize: 14 },
  matchMessage: { ...typeface.regular, color: t.text, fontSize: 14, lineHeight: 21 },
  action: { minHeight: MIN_TOUCH_TARGET },
  actionBar: { borderTopWidth: 0, backgroundColor: "transparent", paddingTop: spacing.md },
})
