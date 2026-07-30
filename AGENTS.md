# AGENTS.md — ezzy-vendor-mobile

Expo/React Native counterpart to the **vendor** portal (Bookdeck Vendor).

This file layers on top of the workspace root `AGENTS.md` at `../AGENTS.md`.
Everything there applies unless overridden below. Work from the workspace root
(`/home/joshua/RS`) so `architecture/`, `.plans/`, and the shared skills stay in
context — not from inside this folder.

---

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
writing any code. Do not rely on pre-SDK-57 recall — this SDK is new enough that
most training-data patterns are stale.

Before implementing or reviewing any feature, read and apply
`.claude/skills/mobile-dev/SKILL.md` (App Store / Google Play compliance
checklist). Skill paths resolve from the workspace root.

---

## AGENTS.md Use

- Read and apply all discovered instruction files together.
- Precedence is: global instructions, then project-root-to-current-directory `AGENTS.md` / `AGENTS.override.md`.
- More local files override broader guidance when they conflict.
- In the same directory, `AGENTS.override.md` takes precedence over `AGENTS.md`.
- Edit the global instruction file for cross-project defaults.
- Edit the project `AGENTS.md` for repo-specific rules.
- Edit a nested `AGENTS.override.md` or `AGENTS.md` when the rule is specific to a subdirectory or subsystem.
- Keep this preamble identical in every `AGENTS.md` so AI agents can interpret layering consistently.

---

## Current state

**Built out and running on a physical Android device.** The template scaffolding
is gone; everything under `src/` is real app code and *is* the pattern to follow.

Build-out plan: `.plans/2026-07-27-ezzy-vendor-mobile-companion.md` — the
authoritative record of scope, decisions (D1–D13), and per-phase status.

| Phase | State |
|---|---|
| Ph0–Ph6 | ✅ Code complete — auth + deep-link password reset, vendor access gate, multi-vendor picker, tab shell + theming, dashboard stats, bookings with approve/reject, transactions, notifications with Realtime, settings |
| Ph7 (push) | 🔄 Client and backbone code written; blocked on FCM/APNs credentials, the `device_push_tokens` migration, and the Edge Function deploy |
| Ph8 (store) | 🔄 Config, declarations and **brand assets** done (icon + splash, 2026-07-30 — regenerate with `scripts/generate-brand-assets.js`); **B5** store listing assets (screenshots, descriptions), **B6** privacy policy + deletion route, **B7** Play account type block submission |

Verification status matters here: phases were verified on **Android**. **Nothing
has been verified on iOS** — App Store Expo Go cannot open an SDK 57 project, so
iOS needs a paid Apple Developer account (plan **B9**, procedure in
`IOS-BUILD.md`). State which platforms you actually ran when marking work done.

Own git repository (`origin` → `thumbtaper/vendor-mobile`), separate from the
workspace root repo. Commits for this app must be made **from inside this
folder**.

### Operational docs in this folder

| File | Covers |
|---|---|
| `EAS-SETUP.md` | Android EAS builds, build profiles, env-var scoping, Metro connectivity, troubleshooting |
| `IOS-BUILD.md` | Apple enrolment, credentials EAS needs, device registration, ad-hoc vs TestFlight |
| `STORE-SUBMISSION.md` | Store listing, declarations, review notes |

---

## Layout

```
src/
├── app/           # expo-router routes; (app)/ is the authenticated tab group
├── components/    # feature-grouped: auth/ bookings/ common/ dashboard/
│                  #   layout/ notifications/ settings/ transactions/ vendor/
├── hooks/         # cross-screen hooks (queries, realtime, session, vendor gate)
├── lib/           # supabase client + keystore adapter, constants, query client,
│                  #   notifications, format helpers, types
├── providers/     # SessionGate, Snackbar, Push
├── services/      # one file per domain; no React imports
└── theme/         # tokens.ts, AppThemeProvider, useAppTheme
```

`@/*` resolves to `./src/*` and `@/assets/*` to `./assets/*` (see `tsconfig.json`).

There is no `components/ui/`, no `constants/`, and no `global.css` — those were
template artifacts and were removed in Ph0.

---

## Overrides to the root AGENTS.md

### Component Conventions — React Native variant

The root file's render/hook split applies **unchanged**: every component with
state, effects, or handlers gets a companion `useComponentName.ts` in the same
directory, and the `.tsx` stays a pure render layer.

What differs: **React Native has no CSS modules.** The root rule "non-trivial
styling goes in a co-located `ComponentName.module.css`" is replaced by:

- Static styling goes in a co-located `ComponentName.styles.ts`. **D1-A settled
  this: `.styles.ts`, no NativeWind.** Because the app is themed, the file
  exports a `makeStyles(tokens)` factory rather than a bare `StyleSheet.create`,
  and the render layer calls
  `const styles = useMemo(() => makeStyles(tokens), [tokens])`.
- Static inline `style={{ ... }}` in the render layer remains prohibited. Only
  genuinely dynamic values (a width from state, a gesture-driven transform) may
  stay inline.

`ConfigErrorScreen/` is a compact three-file example of the whole convention.

See `.claude/skills/component-separation/SKILL.md` for the full convention.

### Tech stack

Next.js, `@supabase/ssr`, next-themes, Leaflet, sonner, and shadcn/ui from the
root tech-stack section **do not apply here**. The native choices are made — use
them, don't re-litigate:

| Concern | This app | Decision |
|---|---|---|
| Styling / theming | `.styles.ts` + `theme/tokens.ts` + `AppThemeProvider` (light/dark/system, persisted) | D1-A |
| Icons | `lucide-react-native` | — |
| Toasts | Hand-rolled Reanimated `Snackbar` — no `sonner-native` | D3 |
| Server state | TanStack Query, `AppState` focus manager, bounded AsyncStorage persistence; writes are never queued offline | D8, D11 |
| Session storage | `expo-secure-store` behind a chunking adapter (~2 KB iOS Keychain cap) | D6-A |
| Auth flow | `flowType: "pkce"`, `detectSessionInUrl: false` — diverges from the web apps' implicit flow, deliberately | — |
| Lists | `@shopify/flash-list` | — |
| Maps | None. The vendor portal has no maps | — |

### Traps that have already cost a build cycle

- **A guarded `<Stack>` must set `initialRouteName`.** A false guard removes the
  screen; if that empties the stack the router falls back to `routeNames[0]` —
  the first *declared* screen. `.plans/2026-07-29-vendor-mobile-guard-fallback-route.md`
- **Never `import` a native module that throws on evaluation.** `expo-notifications`
  does on Expo Go/Android and takes the importing file down with it — hence the
  lazy accessor in `lib/pushModule.ts`. Type-only imports are fine.
- **Never throw at module scope for missing config.** In a release build there is
  no red box; the process dies looking like a native crash. `lib/constants.ts`
  exports `MISSING_CONFIG` and the root layout renders `ConfigErrorScreen`.
  `.plans/2026-07-28-vendor-mobile-preview-crash.md`
- **EAS environment variables are scoped per environment.** A variable set for
  `development` is invisible to a `preview` build. `EAS-SETUP.md` §4.
- **Pure logic that needs a test must live in its own module** — tests run under
  `node --test` with no framework, so anything importing `lib/supabase/client`
  cannot load. See `vendorMapping.ts`, `bookingErrors.ts`, `transactionTotals.ts`.

### Environment variables

Public values use the `EXPO_PUBLIC_` prefix, not `NEXT_PUBLIC_`.
`SUPABASE_SERVICE_ROLE_KEY` must never reach this app under any prefix — anything
needing service-role privileges is called over HTTPS against the deployed vendor
app's API routes, keeping the key on that server.

### Commands

Run from the workspace root with `--prefix`, or from inside this folder:

**Node is not on `PATH` in this shell.** Every command below needs it first:

```bash
export PATH="$HOME/.nvm/versions/node/v22.17.0/bin:$PATH"
```

Node 22+ specifically — `npm test` uses `--experimental-strip-types`.

| Task | Command |
|---|---|
| Start | `npm --prefix ezzy-vendor-mobile run start` |
| Android / iOS / web | `npm --prefix ezzy-vendor-mobile run android` (`ios`, `web`) |
| Dev client (not Expo Go) | `npx expo start --dev-client` from inside this folder |
| Lint | `npm --prefix ezzy-vendor-mobile run lint` |
| Type check | `ezzy-vendor-mobile/node_modules/.bin/tsc --noEmit --project ezzy-vendor-mobile/tsconfig.json` |
| Unit tests | `npm --prefix ezzy-vendor-mobile test` — `node --test`, no framework |
| Bundle check | `npx expo export --platform android` — proves the route tree builds; delete `dist/` afterwards |
| Install an Expo package | `npx expo install <pkg>` **from inside this folder** — approval gate applies |

Use the binary directly for type checks — `npm --prefix … exec tsc` resolves
packages over the network and hangs.

`tsc`, `expo lint` and the test suite are all clean. **Treat any output from them
as a regression you introduced.**

None of those four commands exercises runtime behaviour on a device. State
plainly which checks were machine-run and which still need a device — see
Current state on the iOS gap.

---

## Unchanged from root

The shared Supabase project and its RLS boundaries, the no-custom-auth rule, the
migration discipline, hand-written TypeScript interfaces, plan-authoring
requirements, Canadian English, and every Red Line in the root file apply here
exactly as written.
