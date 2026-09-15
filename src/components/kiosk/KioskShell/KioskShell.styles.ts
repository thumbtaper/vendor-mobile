import { StyleSheet } from "react-native"
import { MIN_TOUCH_TARGET, spacing, type Tokens } from "@/theme/tokens"
export const makeStyles = (t: Tokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: t.modalBg },
  keyboard: { flex: 1 },
  hidden: { display: "none" },
  content: { flexGrow: 1, padding: spacing.xl, gap: spacing.xl },
  header: { alignItems: "flex-end" },
  staff: { minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET, padding: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  text: { color: t.text, fontSize: 15, lineHeight: 22 },
  title: { color: t.strong, fontSize: 24, fontWeight: "700", textAlign: "center" },
  body: { flex: 1, justifyContent: "center", gap: spacing.xl, width: "100%", maxWidth: 560, alignSelf: "center" },
  brand: { alignSelf: "center", width: 96, height: 80, tintColor: t.strong },
})
