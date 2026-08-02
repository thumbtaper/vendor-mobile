// Extends app.json so the display name can come from the environment.
//
// app.json stays the source of truth for everything static; this file only
// overrides what needs to vary per environment. Expo reads app.json first and
// passes it in as `config`.
//
// The name is what appears under the icon on the home screen and in the store
// listing, so it is baked in at BUILD time — changing EXPO_PUBLIC_APP_NAME
// requires a rebuild (or a dev-server restart in Expo Go), not just a reload.
//
// `name` in app.json is the fallback used when EXPO_PUBLIC_APP_NAME is unset.
// (It cannot be annotated there: app.json is schema-validated and expo-doctor
// rejects unknown keys, including comment keys.)
//
// VERSION — package.json is the single source of truth.
//
// `expo.version` was removed from app.json rather than left alongside this: the
// two had already drifted apart (package.json said 0.7.0 while app.json said
// 1.0.0), which is the whole reason this seam exists. A value that is always
// overridden is a value nobody maintains, and it would drift again the first time
// package.json is bumped.
//
// Everything downstream follows from here: the version the OS reports, what the
// stores show, and what `Constants.expoConfig.version` returns to the Settings
// screen. `npm version <x>` therefore updates all of them at once.

import pkg from "./package.json"

export default ({ config }) => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME ?? "Ezzy Vendor",
  version: pkg.version,
})
