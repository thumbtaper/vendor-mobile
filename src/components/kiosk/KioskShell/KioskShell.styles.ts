import { StyleSheet } from "react-native"
import { MIN_TOUCH_TARGET, spacing, type Tokens } from "@/theme/tokens"
export const makeStyles = (t: Tokens) => StyleSheet.create({
  gradient: { flex: 1 },
  root: { flex: 1 },
  keyboard: { flex: 1 },
  hidden: { display: "none" },
  catalogueHost: { flex: 1, minHeight: 0 },
  screen: { flex: 1, paddingHorizontal: spacing.xl },
  header: { minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  identity: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md, minWidth: 0 },
  identityCopy: { flex: 1, minWidth: 0 },
  identityName: { color: t.strong, fontSize: 16, fontWeight: "700", flexShrink: 1 },
  identitySub: { color: t.text, fontSize: 12, lineHeight: 18, flexShrink: 1 },
  kioskBadge: { borderWidth: 1, borderColor: t.pillBdr, backgroundColor: t.pillBg, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  kioskBadgeText: { color: t.strong, fontSize: 12, fontWeight: "700" },
  staff: { minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET, padding: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  text: { color: t.text, fontSize: 15, lineHeight: 22 },
  title: { color: t.strong, fontSize: 24, fontWeight: "700", textAlign: "center" },
  body: { flex: 1, width: "100%", maxWidth: 560, alignSelf: "center" },
  welcome: { flex: 1, justifyContent: "center", gap: spacing.xl },
  brandMark: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", ...t.btnPrimaryShadow },
  brand: { width: 24, height: 24, tintColor: t.btnPrimaryFg },
})
