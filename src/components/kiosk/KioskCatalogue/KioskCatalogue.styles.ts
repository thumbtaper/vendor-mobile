import { StyleSheet } from "react-native"
import { MIN_TOUCH_TARGET, spacing, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) => StyleSheet.create({
  content: { gap: spacing.lg },
  heading: { color: t.strong, fontSize: 22, fontWeight: "700" },
  text: { color: t.strong, fontSize: 15, lineHeight: 22, flexShrink: 1 },
  muted: { color: t.text, fontSize: 14, lineHeight: 21 },
  card: { borderWidth: 1, borderColor: t.cardBdr, borderRadius: 8, padding: spacing.lg, gap: spacing.md, backgroundColor: t.cardBg },
  photos: { gap: spacing.sm },
  photo: { width: "100%", aspectRatio: 16 / 9, borderRadius: 8, backgroundColor: t.subBg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  choice: { flexGrow: 1, flexBasis: 130, minHeight: MIN_TOUCH_TARGET, padding: spacing.md, gap: spacing.xs,
    borderWidth: 2, borderColor: t.cardBdr, borderRadius: 8, backgroundColor: t.cardBg },
  selected: { borderColor: t.accent, backgroundColor: t.editBtnBg },
  disabled: { opacity: 0.5 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, flexWrap: "wrap" },
  icon: { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: t.inputBdr, borderRadius: 8 },
  quantity: { minWidth: 40, textAlign: "center", color: t.strong, fontSize: 18 },
})
