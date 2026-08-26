import { StyleSheet } from "react-native"

import { spacing, type, type Tokens } from "@/theme/tokens"

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    // The `spacing.xl` inset here is what every scrolling-header piece relies on
    // (B1). FlashList v2 never reads `contentContainerStyle` itself — it is not in
    // the prop list `RecyclerView` destructures, so it falls through to the
    // underlying ScrollView, whose content container wraps the header along with
    // the cells. Anything rendered in `header` is therefore inset by this padding
    // and must NOT carry a horizontal inset of its own. A future full-bleed header
    // control must opt into that deliberately with its own negative margin.
    //
    // No `gap` here — FlashList lays every cell out absolutely
    // (`ViewHolder`: `position: "absolute"`), so a flex gap on the content
    // container is silently inert. Row spacing is the `separator` below,
    // handed to `ItemSeparatorComponent`. `padding` *is* honoured.
    content: {
      padding: spacing.xl,
    },
    // The loading and error states scroll (B1). The header can be tall — on
    // Transactions it is a preset row, a search field and four summary cards — so
    // on a small phone a non-scrolling state view would push the spinner or the
    // retry control off the bottom, out of reach.
    //
    // It must carry the SAME horizontal inset as `content` above: header pieces
    // no longer bring their own. Miss it and the header sits flush to both edges
    // in precisely the two states where the vendor is trying to read it.
    stateContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
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
