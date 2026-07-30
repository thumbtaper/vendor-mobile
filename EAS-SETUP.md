# EAS setup — Android

Step-by-step for building and running this app through EAS, assuming a **hosted
Supabase project** (no local stack, no LAN dependency).

Written 2026-07-28. Covers Android only — iOS additionally requires an Apple
Developer Program membership (~$99/yr); see the plan's **B9**.

---

## 0. What you need

- An **Expo account** (free) with access to the `ezzydevguys-team` org — `app.json`
  sets `"owner": "ezzydevguys-team"` and `extra.eas.projectId`, so the project is
  already linked to that org. If you don't have access, see §2b.
- Your **hosted Supabase** project URL and **anon** key.
- Node on PATH. In this WSL shell that means nvm:
  `export PATH="$HOME/.nvm/versions/node/v22.17.0/bin:$PATH"`

**Free tier:** 15 Android builds/month, 45-minute build timeout. Plenty here.

Every command below runs from `ezzy-vendor-mobile/`.

---

## 1. Point the app at hosted Supabase

Edit `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key from Dashboard → Project Settings → API>
EXPO_PUBLIC_VENDOR_PORTAL_URL=<deployed vendor web portal, or leave blank>
EXPO_PUBLIC_APP_NAME=Ezzy Vendor
```

⚠️ **Anon key only.** The service-role key must never appear in this file or in
any `EXPO_PUBLIC_` variable — it would ship inside the binary.

`.env` is gitignored. Restart the dev server after editing it: `EXPO_PUBLIC_*`
values are inlined at bundle time, so a reload alone will not pick them up.

---

## 2. Log in

```bash
npx eas-cli@latest login
npx eas-cli@latest whoami
```

### 2b. If you don't have access to `ezzydevguys-team`

Either get invited to that org, or point the project at your own account:

1. Change `"owner"` in `app.json` to your Expo username (or remove it).
2. Delete the `extra.eas.projectId` value.
3. Run `npx eas-cli@latest init` — it creates a new project and writes a new id.

Do **not** leave a mismatched `owner` + `projectId`; builds fail with a
permissions error that reads like a login problem.

---

## 3. Confirm the link

```bash
npx eas-cli@latest project:info
```

Should print the project name and id matching `app.json`.

---

## 4. Set EAS environment variables

**Why this matters, and the mistake it prevents:**

- A **development build** gets its JavaScript from *your local Metro*, so your
  local `.env` applies at runtime.
- A **preview or production build** bundles JavaScript **on EAS's servers**,
  which never see your `.env`.

Skip this and a preview build launches fine and then fails at sign-in — looking
exactly like a bug in the app.

```bash
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://<ref>.supabase.co"
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon key>"
npx eas-cli@latest env:create --name EXPO_PUBLIC_APP_NAME --value "Ezzy Vendor"
npx eas-cli@latest env:create --name EXPO_PUBLIC_VENDOR_PORTAL_URL --value "https://<vendor-portal-domain>"
```

That is **all four** of the app's public variables — the set in `.env.example`. The
fourth is easy to skip because nothing crashes without it: `lib/constants.ts`
defaults `WEB_PORTAL_URL` to `null` and the affected links are *hidden* rather than
shown broken. What silently disappears from the build is the "Open the web portal"
link on sign-in and the Settings rows for **account deletion** and the **privacy
policy** — and those two are store-review requirements (D13-A, B6), so an unset
value here is a submission problem rather than a cosmetic one.

`env:create` prompts for an **environment** (development / preview / production)
— a variable set for one is invisible to the others. Each build profile in
`eas.json` names its environment explicitly (`"environment": "preview"`, etc.), so
set the variables for the environment matching the profile you intend to build.

Simplest habit: set all four in **every** environment you build, so switching
`--profile` never needs a second thought. A development build reads its
`EXPO_PUBLIC_*` values from your local `.env` at runtime (see above), but
`app.config.js` is still evaluated on EAS, so `EXPO_PUBLIC_APP_NAME` in the
`development` environment is what names the installed app — falling back to
`app.json`'s value when unset.

Verify per environment:

```bash
npx eas-cli@latest env:list --environment preview
npx eas-cli@latest env:list --environment development
```

---

## 5. Build

`eas.json` already defines the profiles. Pick based on what you're doing:

| Profile | JS source | Needs a dev server? | Use it for |
|---|---|---|---|
| `development` | your local Metro | **Yes** | Day-to-day work — hot reload, dev menu, **required for push testing** |
| `preview` | bundled into the APK | **No** | Standalone checks with zero network dependency on your laptop |

### Development build

```bash
npx eas-cli@latest build --profile development --platform android
```

### Preview build (fully standalone)

```bash
npx eas-cli@latest build --profile preview --platform android
```

**First build only:** EAS offers to generate an Android keystore — say **yes**.
It stores and reuses it; losing it later means you cannot update an app already
published to Play, so let EAS keep it.

Expect ~10–20 minutes on the free queue. At the end you get a URL and QR — open
it on the phone, download the APK, allow "install from unknown sources".

Both profiles produce an APK (set via `android.buildType`), so no Play Store or
`$25` developer account is needed to install them.

---

## 6. Run a development build

```bash
npx expo start --dev-client
```

Not `--go`. Open the **Ezzy Vendor** app on the phone (not Expo Go) and connect.

The phone must be able to reach Metro. Three ways, best first:

**a. USB cable — most reliable.** Android platform-tools on *Windows* (not WSL —
USB passthrough into WSL needs `usbipd-win`). Enable Developer options → USB
debugging on the phone, then in PowerShell:

```powershell
adb devices                      # authorise the prompt on the phone
adb reverse tcp:8081 tcp:8081
```

Then connect the dev build to `http://localhost:8081`. This bypasses Wi-Fi, VPN
and firewall entirely. Because Supabase is hosted, **only port 8081 needs
forwarding**.

**b. Tunnel** — `npx expo start --dev-client --tunnel`. Installs `@expo/ngrok` on
first use. Slower, but needs no cable.

**c. LAN** — `npx expo start --dev-client --lan`. Only works if the phone can
reach this machine directly. A VPN holding the default route on the host breaks
this (see the plan's notes on `eth2`/`10.2.0.2`).

## 6b. Run a preview build

Just open it. No dev server, no cable, no tunnel — the JS is inside the APK.
To pick up code changes you must rebuild.

---

## 7. Troubleshooting

| Symptom | Cause |
|---|---|
| `RuntimeException: Unable to load script … index.android.bundle` | You installed a **`development`** build and no Metro is reachable. That profile ships an APK with **no JS inside it** — the bundle comes from your laptop at runtime. Either connect Metro (§6a) or build `preview` instead (§6b) |
| Build fails on permissions | `owner` / `projectId` mismatch — see §2b |
| App installs, sign-in fails | `EXPO_PUBLIC_*` not set as EAS env vars (§4) — preview/production only |
| Dev build opens but won't connect | Metro unreachable — use §6a |
| "Incompatible with this version of Expo Go" | You opened Expo Go, not the dev build |
| Sign-in fails after a week idle | Supabase free tier auto-pauses after 7 days with no API requests. Resume it in the dashboard |
| Push still unavailable | Needs FCM credentials — see below |

---

## 8. What this does not cover

- **Push notifications (Ph7).** A development build is necessary but not
  sufficient — Android also needs an **FCM v1 service-account key** uploaded to
  EAS, plus the `device_push_tokens` migration applied to the hosted project and
  the `send-push-notification` Edge Function deployed.
- **iOS.** Needs an Apple Developer Program membership for device provisioning,
  regardless of EAS. Step-by-step in **`IOS-BUILD.md`**; the reasoning behind
  needing the account at all is **B9**.
- **Play Store submission.** A separate $25 one-time Google Play account, plus
  everything in `STORE-SUBMISSION.md`.
- **Applying migrations to the hosted project.** `backbone/supabase/migrations/`
  must be pushed there, and the dev `seed.sql` should **not** be — it creates 15
  test users.
