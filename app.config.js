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

export default ({ config }) => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME ?? "Ezzy Vendor",
})
