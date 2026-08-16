import { StyleSheet } from "react-native"

import { MIN_TOUCH_TARGET, radii, type Tokens } from "@/theme/tokens"

/**
 * ⚠️ A DELIBERATE COPY of `SettingsAction.styles.ts` — the two buttons sit side by
 * side in the same header row and must be identical.
 *
 * Copied rather than extracted into a shared `HeaderAction`, which was considered:
 * extracting means rewriting a working component to gain twelve lines of geometry,
 * and this app's rule is to avoid abstractions that do not solve a root issue.
 * The cost is bounded by the arrangement itself — these two render adjacent, so
 * any divergence in size, radius or press state is visible immediately rather than
 * silently. **Edit both in the same change.**
 *
 * **Trigger to extract:** a third header action. Two is a pair; three is a pattern.
 */
export const makeStyles = (t: Tokens) =>
  StyleSheet.create({
    button: {
      width: MIN_TOUCH_TARGET,
      height: MIN_TOUCH_TARGET,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.pillBg,
      borderWidth: 1,
      borderColor: t.pillBdr,
    },
    pressed: {
      opacity: 0.7,
    },
  })
