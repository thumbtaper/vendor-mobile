# Ezzy Vendor — mobile

Expo / React Native companion to the **Bookdeck Vendor** web portal. A vendor can
sign in, see today's numbers, and approve or reject bookings from their phone.

It is a new *client* of the existing system, not a new backend: the same Supabase
project, the same tables, the same RLS boundaries as the web portal.

- **Expo SDK 57** · React Native 0.86 · React 19 · TypeScript (strict)
- **`expo-router`** file-based routing, with auth gating via `Stack.Protected`
- **Supabase** for auth, data and realtime — sessions persisted in the device keystore
- **TanStack Query** for server state, with a bounded offline read cache

Bundle ID / package: `ph.ezzy.vendormobile`. Phone only — no tablet layout, no
web target.

---

## Prerequisites

Node 22+ must be on `PATH`. In this WSL shell that means nvm:

```bash
export PATH="$HOME/.nvm/versions/node/v22.17.0/bin:$PATH"
```

Then, from this folder:

```bash
npm install
cp .env.example .env      # then fill it in — see below
```

### Environment

`.env` is gitignored and holds four public values:

| Variable | Notes |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Hosted project URL, or a local stack |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Anon key only** |
| `EXPO_PUBLIC_VENDOR_PORTAL_URL` | Deployed web portal. Optional — links are hidden when unset |
| `EXPO_PUBLIC_APP_NAME` | Home-screen name. Baked in at build time |

`SUPABASE_SERVICE_ROLE_KEY` must **never** appear here under any prefix.
`EXPO_PUBLIC_*` values are inlined into the bundle, so anyone who unpacks the
binary can read them — and this app has no service-role dependency at all.

Metro inlines these at bundle time, so **restart the dev server after editing
`.env`** — a reload is not enough. If a required value is missing, the app shows
a config-error screen naming it rather than crashing.

---

## Running it

```bash
npx expo start --dev-client
```

**Not Expo Go.** On iOS, App Store Expo Go cannot open an SDK 57 project at all;
on Android it works but can never do push notifications. Use a development build
from EAS — see `EAS-SETUP.md`.

| Task | Command |
|---|---|
| Lint | `npm run lint` |
| Type check | `node_modules/.bin/tsc --noEmit` |
| Unit tests | `npm test` |

Tests run on Node's built-in runner with no framework, so a module that imports
the Supabase client cannot be loaded by one. Pure logic that needs testing lives
in its own file — `services/vendorMapping.ts`, `services/bookingErrors.ts`,
`services/transactionTotals.ts`.

---

## Layout

```
src/
├── app/           # routes; (app)/ is the authenticated tab group
├── components/    # feature-grouped, one folder per component
├── hooks/         # queries, realtime subscriptions, session, vendor gate
├── lib/           # supabase client, constants, query client, formatting
├── providers/     # SessionGate, Snackbar, Push
├── services/      # one file per domain, no React imports
└── theme/         # design tokens and the theme provider
```

Every component with state, effects or handlers is three files: `Name.tsx`
(render only), `useName.ts` (all logic), and `Name.styles.ts` (a
`makeStyles(tokens)` factory). Inline `style={{}}` is reserved for genuinely
dynamic values. `components/common/ConfigErrorScreen/` is a short example of all
three.

---

## Building and shipping

| Doc | Covers |
|---|---|
| **`EAS-SETUP.md`** | Android builds via EAS — profiles, environment variables, connecting a device, troubleshooting |
| **`IOS-BUILD.md`** | iOS — Apple Developer enrolment, what EAS needs from you, device registration, ad-hoc vs TestFlight |
| **`STORE-SUBMISSION.md`** | Store listings, declarations and review notes |

The most common mistake is installing a **development** build and opening it with
no Metro running: that profile ships an APK with no JavaScript inside it. Build
**preview** for a standalone app. `EAS-SETUP.md` §5 compares them.

Current state: verified on a physical **Android** device. **Nothing has been
verified on iOS yet** — that needs a paid Apple Developer account (`IOS-BUILD.md`).

---

## Where the rest of the documentation lives

This app is one of five in the workspace. The shared, cross-app documentation
lives in the parent repo:

- `../architecture/` — schema, conventions, portals, and how the apps fit together
- `../.plans/` — dated plan documents, including this app's build-out plan,
  `2026-07-27-ezzy-vendor-mobile-companion.md`
- `AGENTS.md` — working rules for this app, including the traps worth reading
  before you touch routing, native module imports, or configuration

Work from the workspace root so those stay in reach. Commits for this app must be
made from **inside this folder** — it is its own git repository
(`thumbtaper/vendor-mobile`).
