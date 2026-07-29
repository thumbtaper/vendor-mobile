import { StyleSheet } from "react-native"

import type { Tokens } from "@/theme/tokens"

// RN 0.86 no longer exposes `StyleSheet.absoluteFillObject` in its types, so the
// four edges are written out rather than spread.
const FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const

export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    fill: {
      ...FILL,
    },
    tint: {
      ...FILL,
      backgroundColor: t.tabbarBg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.barBdr,
    },
  })
