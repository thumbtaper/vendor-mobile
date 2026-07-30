import { StyleSheet } from "react-native"

import { spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    content: {
      // No `gap` here — FlashList lays every cell out absolutely
      // (`ViewHolder`: `position: "absolute"`), so a flex gap on the content
      // container is silently inert. Row spacing is the `separator` below,
      // handed to `ItemSeparatorComponent`. `padding` *is* honoured.
      padding: spacing.xl,
    },
    separator: {
      height: spacing.md,
    },
    centred: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xxl,
      gap: spacing.md,
    },
    message: {
      color: t.text,
      fontSize: type.body.size,
      lineHeight: 21,
      textAlign: "center",
    },
    messageTitle: {
      color: t.strong,
      fontSize: type.body.size,
      fontWeight: "600",
      textAlign: "center",
    },
    footer: {
      paddingVertical: spacing.xl,
      alignItems: "center",
    },
  })
