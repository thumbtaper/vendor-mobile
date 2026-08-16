import { StyleSheet } from "react-native"

import { radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    // `paddingBottom` is applied INLINE from `useRejectReasonSheet`'s
    // `bottomInset` — it depends on the device's safe-area inset, which a static
    // stylesheet cannot see. Do not reinstate a static one here: this sheet is
    // anchored to the bottom edge, and on edge-to-edge Android that edge is behind
    // the system navigation.
    sheet: {
      gap: spacing.lg,
      padding: spacing.xl,
      borderTopLeftRadius: radii.card,
      borderTopRightRadius: radii.card,
      backgroundColor: t.modalBg,
      borderTopWidth: 1,
      borderColor: t.panelBdr,
    },
    grabber: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: radii.pill,
      backgroundColor: t.toggleOff,
    },
    title: {
      color: t.strong,
      fontSize: type.title.size,
      fontWeight: type.title.weight,
    },
    body: {
      color: t.text,
      fontSize: type.body.size,
      lineHeight: 21,
    },
    input: {
      minHeight: 96,
      padding: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      backgroundColor: t.inputBg,
      borderColor: t.inputBdr,
      color: t.inputColor,
      fontSize: type.body.size,
      textAlignVertical: "top",
    },
    actions: {
      gap: spacing.md,
    },
  })
