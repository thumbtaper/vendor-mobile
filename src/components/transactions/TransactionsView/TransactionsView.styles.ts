import { StyleSheet } from "react-native"

import { spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // No horizontal inset (B1) — this now lives inside the list's scrolling
    // header, which sits within the content container's `spacing.xl` padding.
    toolbar: {
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    // The `presets` / `preset` / `presetActive` / `presetLabel` /
    // `presetLabelActive` styles were removed with the inline segmented control
    // they dressed — the toolbar now renders the shared `PeriodFilter`, which
    // brings its own `.styles.ts`.
    note: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 18,
      paddingBottom: spacing.sm,
    },
  })
