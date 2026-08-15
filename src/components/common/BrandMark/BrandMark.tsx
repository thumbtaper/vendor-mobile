import { Image } from "react-native"

import { styles } from "./BrandMark.styles"

/**
 * The Ezzy mark, for use inside the app.
 *
 * Pure display — no state, no effects, no handlers — so it ships as `.tsx` +
 * `.styles.ts` with no hook (`component-separation` §4).
 *
 * Uses `mark-white.png`, not the splash or icon assets, and the distinction is
 * deliberate:
 *   - `splash-mark.png` is padded into a square for the Android 12 circular mask,
 *     so rendering it here would draw a lot of empty space and a small logo.
 *   - `icon-android-foreground.png` is padded for LAUNCHER masks, differently.
 *   - `icon-ios.png` is an opaque blue tile and would show as a square on the
 *     navy auth background.
 * White, because every surface this appears on is the dark auth gradient.
 *
 * Regenerate all of them with `scripts/generate-brand-assets.js`.
 *
 * Decorative: the screens using it also say in words what they are doing, so
 * announcing "Ezzy logo" would add noise without adding information.
 */
export function BrandMark() {
  return (
    <Image
      source={require("@/assets/brand/mark-white.png")}
      style={styles.mark}
      resizeMode="contain"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  )
}
