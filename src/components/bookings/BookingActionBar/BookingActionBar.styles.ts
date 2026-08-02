import { Platform, StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.divider,
      backgroundColor: t.cardBg,
    },
    // Wraps the banners and the button row. The banners sit ABOVE the divider so
    // the bar itself keeps its own top border and its existing padding — nesting
    // them inside `bar` would have made the buttons and the text share a row.
    stack: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.divider,
      backgroundColor: t.cardBg,
    },
    // The auto-confirm countdown. Reads as information, not as a warning: the
    // timer working is the normal, good case — it is what stops one unresponsive
    // customer freezing a vendor's money indefinitely.
    timer: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    // Unpaid, on the other hand, IS a warning — amber, matching the `pending`
    // status hue, which is the app's existing "waiting on something" colour.
    unpaid: {
      color: "#f59e0b",
      fontSize: type.caption.size,
      lineHeight: 18,
      fontWeight: "600",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    // The unpaid confirmation replaces the bar entirely, so it owns the divider
    // and the padding that `bar` would otherwise provide.
    confirm: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.divider,
      backgroundColor: t.cardBg,
      paddingTop: spacing.lg,
      gap: spacing.xs,
    },
    confirmTitle: {
      color: t.strong,
      fontSize: type.body.size,
      fontWeight: "700",
      paddingHorizontal: spacing.lg,
    },
    confirmBody: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
      paddingHorizontal: spacing.lg,
    },
    // 44pt minimum, not the web's ~24pt buttons (plan §5.3). Porting those sizes
    // is the single most likely accessibility failure in this app.
    button: {
      flex: 1,
      minHeight: MIN_TOUCH_TARGET,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.md,
      borderWidth: 1,
    },
    approve: {
      backgroundColor: "rgba(16,185,129,0.12)",
      borderColor: "rgba(16,185,129,0.3)",
    },
    approveLabel: {
      color: "#10b981",
      fontSize: type.body.size,
      fontWeight: "700",
    },
    reject: {
      backgroundColor: "rgba(239,68,68,0.08)",
      borderColor: "rgba(239,68,68,0.2)",
    },
    rejectLabel: {
      color: "#ef4444",
      fontSize: type.body.size,
      fontWeight: "700",
    },
    // `bar` carries its own top divider so it can stand alone (the pending
    // branch). When it sits INSIDE `stack` or `confirm`, that container already
    // drew the divider — without this the vendor sees a doubled hairline.
    barInStack: {
      borderTopWidth: 0,
    },
    // The fulfilment move — the one thing the vendor came to this screen to do,
    // so it carries the app's primary weight rather than the tinted treatment
    // approve/reject share. Solid fill, not a gradient: this button can sit beside
    // Undo, and two competing gradients in one bar reads as noise.
    primary: {
      backgroundColor: t.btnPrimary.colors[0],
      borderColor: t.btnPrimary.colors[1],
    },
    primaryLabel: {
      color: "#ffffff",
      fontSize: type.body.size,
      fontWeight: "700",
    },
    // Undo is deliberately quiet. It is a correction, not a destination — giving
    // it equal visual weight would invite taps on the one action that restarts the
    // customer's 3-day window.
    ghost: {
      backgroundColor: "transparent",
      borderColor: t.divider,
    },
    ghostLabel: {
      color: t.text,
      fontSize: type.body.size,
      fontWeight: "600",
    },
    // The "i" glyph. A serif italic reads unmistakably as an information mark at
    // this size, where a sans-serif "i" is easily mistaken for a stray character
    // or a lowercase L.
    infoGlyph: {
      color: t.text,
      fontSize: type.body.size,
      fontWeight: "700",
      fontStyle: "italic",
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    // Flagging gets its own row beneath the main actions. It is an escalation,
    // not an alternative way to finish the booking, and side-by-side placement
    // would put a destructive-looking control a thumb-width from the primary one.
    // No top border: the row above already separated this block.
    flagRow: {
      flexDirection: "row",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    // Outlined rather than filled. This is a real escalation — Ezzy gets involved
    // and the payout freezes — but it is also the vendor's legitimate escape when
    // something goes wrong, so it must not look like a mistake to press.
    danger: {
      backgroundColor: "transparent",
      borderColor: "rgba(225,29,72,0.35)",
    },
    dangerLabel: {
      color: "#e11d48",
      fontSize: type.body.size,
      fontWeight: "600",
    },
    pressed: {
      opacity: 0.7,
    },
    // In-flight state. Kept distinct from `pressed` so a slow network reads as
    // "working" rather than as a button stuck under a finger.
    disabled: {
      opacity: 0.5,
    },
    resolved: {
      padding: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.divider,
      gap: spacing.xs,
    },
    resolvedText: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
    },
  })
