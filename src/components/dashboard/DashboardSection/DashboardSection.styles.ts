import { StyleSheet } from "react-native"

import { spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // Separation between groups is carried by SPACING AND THE LABEL ALONE — no
    // card chrome, no dividers, no background. Ported from the web section's own
    // reasoning: grouping the widgets is meant to add hierarchy, not a second
    // visual language on a screen that is already a grid of bordered cards.
    section: {
      gap: spacing.sm,
    },
    // Small uppercase, matching the "Waiting for approval" heading already on this
    // screen rather than introducing a third heading treatment.
    title: {
      color: t.text,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    // ⚠️ No `numberOfLines`. This line states which clock the figures below are
    // counted on and whether they are complete — a caption that truncates mid
    // sentence at a large font size is worse than none, and it is the only thing
    // preventing one period control over two groups from implying they measure
    // the same thing.
    caption: {
      color: t.text,
      fontSize: type.caption.size,
      lineHeight: 17,
      opacity: 0.8,
    },
  })
