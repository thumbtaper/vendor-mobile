import { StyleSheet } from "react-native"
import { spacing, type Tokens } from "@/theme/tokens"
import { SIGNATURE_PAPER } from "@/lib/kioskSignature"

export const makeStyles = (t: Tokens) => StyleSheet.create({
  content: { gap: spacing.lg },
  heading: { color: t.strong, fontSize: 22, fontWeight: "700" },
  text: { color: t.strong, fontSize: 15, lineHeight: 22 },
  pad: { width: "100%", aspectRatio: 2, minHeight: 180, backgroundColor: SIGNATURE_PAPER, borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: t.inputBdr },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  signer: { color: t.strong, fontSize: 15, flex: 1, flexShrink: 1 },
  clear: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
})
