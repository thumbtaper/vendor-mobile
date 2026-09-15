import { StyleSheet } from "react-native"
import { spacing, type Tokens } from "@/theme/tokens"
export const makeStyles = (t: Tokens) => StyleSheet.create({
  content: { gap: spacing.lg },
  heading: { color: t.strong, fontSize: 22, fontWeight: "700" },
  text: { color: t.strong, fontSize: 15, lineHeight: 22 },
  muted: { color: t.text, fontSize: 14, lineHeight: 21 },
})
