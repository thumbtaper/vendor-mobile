import { useSafeAreaInsets } from "react-native-safe-area-context"

import { spacing, TAB_BAR_HEIGHT } from "@/theme/tokens"

/**
 * How much room a bottom-anchored surface must leave beneath itself.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * Android is EDGE-TO-EDGE from Expo SDK 54 onward, and this app neither disables
 * it nor could: there is no `edgeToEdgeEnabled` key in `app.json` and no
 * `react-native-edge-to-edge` dependency. The app therefore draws BEHIND the
 * gesture bar / three-button navigation bar, and `insets.bottom` is the only
 * thing keeping a control clear of it.
 *
 * The tab bar compounds that: `tabBarStyle: { position: "absolute" }`
 * (`app/(app)/_layout.tsx`) takes it out of layout flow, so it floats over content
 * and occupies no space. Screens inside the tab group must clear it themselves.
 *
 * Four call sites already composed this by hand, and three more were missing it
 * entirely — both sheets and the settings list, whose buttons sat under the system
 * navigation. `TAB_BAR_HEIGHT`'s own comment records that it became a constant
 * because two hand-written copies had already DISAGREED (49 vs 64). This hook is
 * that lesson applied one level up: the composition is written once.
 *
 * ── The one thing to get right ──────────────────────────────────────────────
 * ⚠️ `tabBar` is a PARAMETER, never an assumption, and the two cases are not
 * interchangeable:
 *
 *   - A tab SCREEN sits under the floating bar     → needs TAB_BAR_HEIGHT + inset
 *   - A `Modal` COVERS the bar entirely            → needs the inset alone
 *
 * Passing `tabBar: true` from inside a Modal adds 49pt of padding to a surface
 * nothing is floating over; passing `false` from a tab screen puts the control
 * back under the bar. Neither is visible to any machine check in this repo.
 *
 * @param tabBar Whether the floating tab bar overlaps this surface.
 * @param extra  Design spacing to sit ON TOP of the system inset — never instead
 *               of it. Defaults to `spacing.xl`, which is what every scroll
 *               surface in the app already used.
 */
export function useBottomInset({
  tabBar,
  extra = spacing.xl,
}: {
  tabBar: boolean
  extra?: number
}): number {
  const insets = useSafeAreaInsets()
  return (tabBar ? TAB_BAR_HEIGHT : 0) + insets.bottom + extra
}
