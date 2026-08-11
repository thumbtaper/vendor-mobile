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
| **Fulfilment** | ✅ Shipped 2026-08-02 — the full vendor side of dual acknowledgement: hand over / mark as done / got it back / undo / flag, all nine statuses, six lifecycle filters with badges, an auto-confirm countdown, and the payout-status-driven payable rule. `.plans/2026-08-02-vendor-mobile-fulfilment-sync.md` |
| Ph7 (push) | 🔄 Client and backbone code written; blocked on FCM/APNs credentials, the `device_push_tokens` migration, and the Edge Function deploy |
| Ph8 (store) | 🔄 Config, declarations and **brand assets** done (icon + splash, 2026-07-30 — regenerate with `scripts/generate-brand-assets.js`); **B5** store listing assets (screenshots, descriptions), **B6** privacy policy + deletion route, **B7** Play account type block submission |

Post-build-out polish runs in its own dated plans rather than in the build-out doc:
styling/branding parity with the vendor web portal
(`.plans/2026-07-29-vendor-mobile-styling-branding.md`, COMPLETE), brand assets
(`.plans/2026-07-30-vendor-mobile-brand-assets.md`, COMPLETE), and UI fixes
(`.plans/2026-07-30-vendor-mobile-ui-fixes.md` + `.plans/2026-07-31-vendor-mobile-filter-density.md`).
Booking status transitions beyond approve/reject **shipped 2026-08-02** via
`.plans/2026-08-02-vendor-mobile-fulfilment-sync.md`. The earlier plan for that
work (`.plans/2026-07-31-vendor-mobile-booking-status-actions.md`) is **✖ ABORTED**
— it predated the feature by a day and proposed a transition the trigger now
rejects. Also 2026-08-02: sign-in keyboard handling and the app version in Settings
(`.plans/2026-08-02-vendor-mobile-keyboard-and-version.md`, COMPLETE). Then the
action-button sizing, the action-info "i" sheet and the dashboard getting-started
guide (`.plans/2026-08-03-vendor-mobile-action-ui-and-guide.md`, COMPLETE,
device-verified), and the full-page scroll model — `ScreenShell` pins only the
action row, each screen renders its own `<ScreenTitle />`
(`.plans/2026-08-05-vendor-mobile-scroll-header-and-fee.md`, **IN PROGRESS**: B1
coded 2026-08-06 and unverified on device; B2, B3a, B3b and I2 not started).

Verification status matters here: phases were verified on **Android**. **Nothing
has been verified on iOS** — App Store Expo Go cannot open an SDK 57 project, so
iOS needs a paid Apple Developer account (plan **B9**, procedure in
`IOS-BUILD.md`). State which platforms you actually ran when marking work done.

**Device verification is not optional on visual work.** Four separate style passes
across two plans shipped changes that machine checks approved and that did nothing on
screen, because the styles were being silently overridden by library defaults (see
Traps below). `tsc`, `expo lint`, `npm test` and `expo export` cannot see that class of
bug. For any visual change, get a screenshot before declaring it fixed.

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
- **A horizontal `ScrollView` fills its cross axis.** RN puts `flexGrow: 1` in the
  base style of every ScrollView (`ScrollView.js:1887-1892`), so in a `flex: 1`
  column a horizontal strip expands to fill all remaining *vertical* space and
  stretches its children to that height. `BookingFilterTabs` rendered ~400pt chips
  this way; `minHeight` and `paddingVertical` on the chip did nothing. Fix is
  `flexGrow: 0` on the ScrollView's own `style` — not `contentContainerStyle`.
  `.plans/2026-07-31-vendor-mobile-filter-density.md` §0.9
- **`gap` in a FlashList `contentContainerStyle` is inert** — v2 lays cells out
  absolutely (`ViewHolder.js:44`), so only `padding` applies. Row spacing goes
  through a **memoised** `ItemSeparatorComponent` (the cell memo compares it by
  identity, `:75`). See `RefreshableList`.
- **A list header must be an ELEMENT, never a component type.** Same identity rule
  as `ItemSeparatorComponent`, worse symptom. React reconciles by element `type`,
  so `header={<Toolbar />}` is stable across renders; `ListHeaderComponent={() =>
  <Toolbar />}` is a new function identity every render and remounts the whole
  header subtree. `RefreshableList` types `header` as `ReactElement` so the wrong
  form is a type error. Found via the Transactions search field, which lost focus
  and closed the keyboard on every keystroke while the list itself looked fine.
  `.plans/2026-08-05-vendor-mobile-scroll-header-and-fee.md` B1
- **The tab bar's height is a constant, not a hook.** Use `TAB_BAR_HEIGHT +
  insets.bottom` from `theme/tokens.ts`. `useBottomTabBarHeight` is vendored inside
  expo-router (`build/react-navigation/bottom-tabs/utils/`) and NOT re-exported;
  installing `@react-navigation/bottom-tabs` to get it is worse, not better — that
  brings a *second* `BottomTabBarHeightContext` the tab navigator never populates,
  so it looks clean and silently returns nothing. The constant exists because two
  call sites had disagreed (49 in `SnackbarProvider`, 64 in `DashboardView`).
- **A screen must render its own `<ScreenTitle />`.** `ScreenShell` pins only the
  action row; the title comes down through `ScreenTitleContext` and belongs inside
  the screen's own scroll container. Omit it and the title vanishes with no error —
  the context defaults to `null` on purpose, because throwing here would kill the
  screen in a release build. `bookings/[id]` nearly hit this: it passes no header
  action, so `ScreenShell` pins nothing there at all.
- **`KeyboardAvoidingView` with `behavior={undefined}` does NOTHING.** `AuthScreen`
  passed `undefined` on Android for months, which is only correct if the window
  itself resizes; the keyboard drew straight over the password field. Each platform
  now gets exactly one mechanism — Android `behavior="height"`, iOS
  `automaticallyAdjustKeyboardInsets` on the ScrollView. **Do not add the second to
  either platform:** stacking them double-compensates and pushes the form off the
  other edge. `.plans/2026-08-02-vendor-mobile-keyboard-and-version.md` B1
- **`justifyContent: "center"` on a ScrollView's `contentContainerStyle` is FINE**
  — this was investigated and cleared. The well-known trap applies to the
  ScrollView's own `style`. On the content container with `flexGrow: 1`, content
  taller than the viewport grows the container, leaving no free space to
  distribute, so it starts at the top and scrolls normally. Recorded because it
  looks like a bug and "fixing" it would break the centring on all six `AuthScreen`
  routes for no gain.
- **An exhaustive `Record<Union, …>` is a COMPILE-time guard only.** The database
  can emit a value newer than an installed binary, and no migration can recompile a
  phone. `NotificationListItem` destructured its `TYPE_ICON` lookup, so the four
  fulfilment notification types crashed the whole Notifications screen — there is
  no error boundary in this app. Every such lookup needs a runtime fallback
  (`?? UNKNOWN_TYPE`) as well as the type.
- **All of the layout traps above pass `tsc`, `expo lint`, `npm test` and `expo export`.** No
  machine check in this repo can see a style that is silently overridden — if a
  spacing change appears to do nothing on device, suspect the container and read
  the library source before re-tuning the value. Ask for a screenshot early.

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
