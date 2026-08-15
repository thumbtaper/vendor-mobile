import { StyleSheet } from "react-native"

/**
 * The asset's own proportions, measured rather than guessed: `mark-white.png` is
 * 1024x845, i.e. 0.8252:1. Height is derived from width here so the mark can never
 * be stretched by someone changing one number — `resizeMode="contain"` would letter-box
 * it instead, which looks like a rendering bug rather than a sizing mistake.
 */
const MARK_ASPECT = 845 / 1024

/** Roughly the width of the sign-in form's heading block, so the loading state
 *  reads as the same screen family rather than a differently-scaled one. */
const MARK_WIDTH = 140

/**
 * A bare `StyleSheet.create`, not the app's usual `makeStyles(tokens)` factory.
 *
 * That convention exists so a module-level stylesheet cannot freeze one theme's
 * COLOURS at import time. There are no colours here — the PNG carries its own, and
 * these are pure geometry — so there is nothing to freeze and nothing to
 * parameterise.
 */
export const styles = StyleSheet.create({
  mark: {
    width: MARK_WIDTH,
    height: Math.round(MARK_WIDTH * MARK_ASPECT),
    alignSelf: "center",
  },
})
