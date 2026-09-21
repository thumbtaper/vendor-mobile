import { StyleSheet } from "react-native"
import { spacing, type Tokens } from "@/theme/tokens"
export const makeStyles = (t: Tokens) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  keyboard: { flex: 1, justifyContent: "center", padding: spacing.xl },
  dialog: { width: "100%", maxWidth: 480, maxHeight: "90%", alignSelf: "center", backgroundColor: t.modalBg, borderRadius: 8 },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: 20, fontWeight: "700", color: t.strong },
  error: { fontSize: 15, lineHeight: 22, color: t.status.disputed.fg },
})
