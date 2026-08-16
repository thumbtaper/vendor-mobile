import { useBottomInset } from "@/hooks/useBottomInset"

/**
 * The one runtime value this sheet needs.
 *
 * It exists as a hook file rather than a `useSafeAreaInsets()` call in the render
 * layer because the component-separation convention puts hooks in the companion
 * file — the `.tsx` stays a pure render layer that receives a number.
 *
 * `tabBar: false`: a `Modal` covers the tab bar, so only the system inset applies.
 * Before this, the sheet had no bottom inset at all and its "Got it" button — the
 * only way out of the sheet — sat under Android's navigation bar (plan B1).
 */
export function useActionInfoSheet() {
  return { bottomInset: useBottomInset({ tabBar: false }) }
}
