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

A pristine `create-expo-app` template. **No app code has been written yet** —
everything under `src/` is starter scaffolding (`explore.tsx`, `themed-text.tsx`,
`hint-row.tsx`, etc.) and should be treated as deletable reference, not as
established project pattern.

- Own git repository, **zero commits so far**, no remote configured.
- Supabase is **not** wired up yet — no client, no auth, no session persistence.
- The sibling `ezzy-booker-mobile` is at the same stage. Its build-out plan,
  `.plans/2026-07-21-ezzy-booker-mobile-buildout.md`, already resolved several
  decisions (session storage via AsyncStorage, `react-native-url-polyfill`,
  TanStack Query, NativeWind) that are worth reusing here rather than
  re-litigating — but they are that app's decisions until adopted explicitly.

---

## Layout

```
src/
├── app/          # expo-router file-based routes
├── components/   # UI components (+ ui/ for primitives)
├── hooks/
├── constants/
└── global.css
```

`@/*` resolves to `./src/*` and `@/assets/*` to `./assets/*` (see `tsconfig.json`).

---

## Overrides to the root AGENTS.md

### Component Conventions — React Native variant

The root file's render/hook split applies **unchanged**: every component with
state, effects, or handlers gets a companion `useComponentName.ts` in the same
directory, and the `.tsx` stays a pure render layer.

What differs: **React Native has no CSS modules.** The root rule "non-trivial
styling goes in a co-located `ComponentName.module.css`" is replaced by:

- Static styling goes in a co-located `ComponentName.styles.ts` exporting a
  `StyleSheet.create({ ... })` object — or NativeWind utility classes if and
  when this app adopts them. Pick one approach app-wide; do not mix.
- Static inline `style={{ ... }}` in the render layer remains prohibited. Only
  genuinely dynamic values (a width from state, a gesture-driven transform) may
  stay inline.
- The template's `animated-icon.module.css` + `global.css` are web-only artifacts
  of the starter and are not the pattern to follow for native screens.

See `.claude/skills/component-separation/SKILL.md` for the full convention.

### Tech stack

Next.js, `@supabase/ssr`, next-themes, Leaflet, sonner, and shadcn/ui from the
root tech-stack section **do not apply here**. The native equivalents (icon
library, toasts, maps, theming) are open decisions — propose, don't assume.

### Environment variables

Public values use the `EXPO_PUBLIC_` prefix, not `NEXT_PUBLIC_`.
`SUPABASE_SERVICE_ROLE_KEY` must never reach this app under any prefix — anything
needing service-role privileges is called over HTTPS against the deployed vendor
app's API routes, keeping the key on that server.

### Commands

Run from the workspace root with `--prefix`, or from inside this folder:

| Task | Command |
|---|---|
| Start | `npm --prefix ezzy-vendor-mobile run start` |
| Android / iOS / web | `npm --prefix ezzy-vendor-mobile run android` (`ios`, `web`) |
| Lint | `npm --prefix ezzy-vendor-mobile run lint` |
| Type check | `ezzy-vendor-mobile/node_modules/.bin/tsc --noEmit --project ezzy-vendor-mobile/tsconfig.json` |
| Install an Expo package | `npx expo install <pkg>` **from inside this folder** — approval gate applies |

Use the binary directly for type checks — `npm --prefix … exec tsc` resolves
packages over the network and hangs.

**Known pre-existing type errors** (2, both in template files): missing types for
`./animated-icon.module.css` and `@/global.css`. These come from the absent
`expo-env.d.ts`, which Expo generates on first `expo start` and which is
gitignored. They are not regressions — expect them to disappear after the app is
run once, and do not "fix" them by hand.

---

## Unchanged from root

The shared Supabase project and its RLS boundaries, the no-custom-auth rule, the
migration discipline, hand-written TypeScript interfaces, plan-authoring
requirements, Canadian English, and every Red Line in the root file apply here
exactly as written.
