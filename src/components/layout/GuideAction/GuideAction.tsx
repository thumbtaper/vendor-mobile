import { Compass } from "lucide-react-native"
import { useMemo } from "react"
import { Pressable } from "react-native"

import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./GuideAction.styles"

/**
 * Header entry point for the getting-started guide.
 *
 * Pure display — the state and the handler belong to whoever owns the guide, which
 * is the dashboard route (the only ancestor of both this button and the card it
 * toggles). So no companion hook, per `component-separation` §4.
 *
 * `Compass` matches the vendor portal's own header button
 * (`vendor/components/layout/TopBar/TopBar.tsx:60-67`), which is icon-only for the
 * same reason this is: it sits in a row of icon controls. Icon-only is exactly why
 * the accessibility label is not optional.
 *
 * A TOGGLE, not a "show": it is the guide's single entry point now that the card's
 * own "Show guide" row is gone, so it has to be able to put the guide away too.
 * The label follows the state rather than staying generic — "Show" on a control
 * that hides is worse than no label.
 */
export function GuideAction({
  expanded,
  onPress,
}: {
  /** Whether the guide is currently on screen. */
  expanded: boolean
  onPress: () => void
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        expanded ? "Hide the getting-started guide" : "Show the getting-started guide"
      }
      accessibilityState={{ expanded }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Compass size={20} color={tokens.strong} />
    </Pressable>
  )
}
