# EAS setup — iOS

Companion to `EAS-SETUP.md` (Android). Written 2026-07-29, for an Apple Developer
Program membership you are about to buy (~$99/yr).

**You do not need a Mac.** EAS builds on hosted macOS workers, signs with
credentials it manages for you, and hands back an installable build. Everything
below runs from this WSL shell.

What you *cannot* do without a Mac is run the iOS **simulator** — so on iOS the
testing loop is always a real device.

Every command runs from `ezzy-vendor-mobile/`, with node on PATH:

```bash
export PATH="$HOME/.nvm/versions/node/v22.17.0/bin:$PATH"
```

---

## 0. Enrol first — it is the only step with a real lead time

<https://developer.apple.com/programs/enroll/> — $99/yr, auto-renewing.

**Decide individual vs organization before you pay.** This is the one choice here
that is annoying to undo.

| | Individual | Organization |
|---|---|---|
| Verification | Apple ID + ID check, usually 24–48 h | Legal entity check **plus a D-U-N-S number** |
| Lead time | Days | **1–3 weeks** — the D-U-N-S lookup/request is the slow part |
| Seller name shown publicly on the App Store | **Your legal name** | The company name |
| Changing later | Support request + effectively re-enrolling | — |

Bookdeck Vendor is a business-facing product, so Organization is almost certainly
what you want on the listing. But it is weeks, not days. A reasonable play:
**start the Organization enrolment now, and if you want to build sooner, note
that nothing below is wasted** — builds, credentials and TestFlight all work the
same either way; only the public seller name differs.

Two things to do while waiting:

- **Turn on two-factor auth** for the Apple ID you will use. EAS cannot log in
  without it, and enabling it mid-flow is a detour.
- Use an Apple ID you control long-term. Signing certificates, the app record and
  TestFlight all hang off it.

You cannot build for a physical iPhone until enrolment completes. There is no
free path around it — see `.plans/2026-07-27-ezzy-vendor-mobile-companion.md`
**B9** for why App Store Expo Go is not an option on this SDK.

### If you were never asked to choose

**The Apple Developer app on iPhone/iPad only enrols Individual** — it never
shows the entity-type question. That choice exists only in the *web* flow at
developer.apple.com/enroll. Check what you ended up with at
developer.apple.com/account → **Membership details**.

Changing afterwards is a support request, not a setting. Apple's route is to
contact Developer Program Support; the common outcome is enrolling the
organization separately and **transferring the apps** — and app transfer requires
the app to have been **publicly released**, so a TestFlight-only app cannot move.
Fix it before the first build, while there is no app record and no registered
bundle identifier to untangle.

The limitation that usually decides it is not the public seller name: **an
Individual account cannot add team members at all** — no second Admin, Developer,
or App Manager. For a team, that means one person holds App Store Connect,
TestFlight and the signing credentials permanently.

---

## 1. Config changes needed: none

Worth stating plainly, because it is the part people expect to be painful.
`app.json` already carries everything iOS needs:

| Key | Value | Why it's already right |
|---|---|---|
| `ios.bundleIdentifier` | `com.ezzy.vendormobile` | Registered on the Developer portal automatically at first build. **Cannot be changed after the app is on the store** — it is fine as-is |
| `ios.supportsTablet` | `false` | iPhone-only, so no iPad screenshots or layout pass needed |
| `ios.infoPlist.ITSAppUsesNonExemptEncryption` | `false` | Skips the export-compliance question Apple otherwise asks on **every single** TestFlight upload |
| `ios.privacyManifests` | UserDefaults + FileTimestamp | Required since 2024; missing entries are an automatic upload rejection |
| `eas.json` `development` profile | `developmentClient: true`, `distribution: internal` | `ios.simulator` already defaults to `false`, so this targets a device. No edit required |

The only genuine gap is **B5 — brand assets**. `ios.icon` still points at
`assets/expo.icon`, which is Expo's template icon. That is fine for development
and TestFlight; it blocks public App Store release, not builds.

---

## 1b. What EAS needs from you, and where to find it

Short list, because EAS's managed-credentials flow generates the rest itself. The
only thing you *type* is your Apple login.

### For `eas build`

| What | Where it comes from | Notes |
|---|---|---|
| **Apple ID** (email) | The account you enrolled with | Prompted on first build |
| **Apple ID password** | Same | Your **real** password, **not** an app-specific password — the Developer Portal login needs the real one |
| **6-digit 2FA code** | Your trusted Apple device | EAS caches the session, so this is not every build |
| **Apple Team ID** | developer.apple.com/account → **Membership details** → *Team ID* (10 chars, e.g. `ABCDE12345`) | Auto-detected; only asked if you belong to several teams |
| **Bundle identifier** | Already in `app.json` — `com.ezzy.vendormobile` | EAS registers it on the portal for you |

Everything else — **Distribution Certificate**, **Ad Hoc / App Store provisioning
profile**, later the **APNs push key** — EAS creates, names, and stores against
the project. You answer "yes" to each prompt. You never touch Keychain Access, a
CSR, a `.p12`, or the Certificates page.

### For `eas submit` (TestFlight / App Store only — not needed to build)

| What | Where to get it | Notes |
|---|---|---|
| **App Store Connect API key** (`.p8`) | appstoreconnect.apple.com → **Users and Access** → **Integrations** → *App Store Connect API* → **Team Keys** → generate, role **App Manager** or Admin | **Downloadable exactly once.** Note the **Key ID** and **Issuer ID** shown on the same page. Generated by the Account Holder or an Admin |
| **ascAppId** | appstoreconnect.apple.com → your app → **App Information** → *Apple ID* (a ~10-digit number) | Not the bundle ID. `eas submit` can create the app record and resolve this itself |
| *(alternative)* **app-specific password** | appleid.apple.com → **Sign-In and Security** → *App-Specific Passwords* | Only if you skip the API key. The key is better — no 2FA prompt, works unattended |

Prefer the API key and let `eas submit` generate it for you the first time.
**Never commit the `.p8`** — it is a credential, and the root AGENTS.md red line
on secrets in workspace files applies.

### Inspecting or replacing any of it later

```bash
npx eas-cli@latest credentials          # interactive: view, regenerate, remove
```

Two Apple limits worth knowing before you click anything in the portal:
**2 Distribution Certificates** per account, and **100 registered iPhones** per
membership year with the counter resetting only at renewal. Do not delete a
certificate Apple lists as in use — let `eas credentials` manage them.

### What EAS does *not* need

No Mac. No manually created certificate or provisioning profile. No CSR, `.p12`,
or Xcode. No hand-typed UDIDs (`device:create` handles it). No APNs key made by
hand.

---

## 2. Register your iPhone

Ad-hoc iOS builds only install on devices baked into the provisioning profile, so
the device must be registered **before** the build.

```bash
npx eas-cli@latest device:create
```

Choose **Website**, then open the printed URL or QR **in Safari on the iPhone**
(Chrome will not install a profile). It downloads a configuration profile; then
on the phone:

**Settings → General → VPN & Device Management → the downloaded profile → Install**

Confirm it landed:

```bash
npx eas-cli@latest device:list
```

Limits: 100 iPhones per membership year, and the counter only resets at renewal —
so do not burn slots on devices you do not test on.

---

## 3. Environment variables — already done

Nothing to do. EAS environment variables are scoped **per environment**
(development / preview / production), **not per platform**. The variables you set
for Android in `EAS-SETUP.md` §4 apply to iOS builds of the same profile.

Sanity check before a preview or production build:

```bash
npx eas-cli@latest env:list --environment preview
```

`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` must both be
there. Missing them no longer crashes the app — it now shows the config-error
screen from `.plans/2026-07-28-vendor-mobile-preview-crash.md` — but the build is
still useless.

---

## 4. First build — the development build

```bash
npx eas-cli@latest build --profile development --platform ios
```

The first run is interactive. Expect, in order:

1. **"Do you want to log in to your Apple account?"** → **yes**. Apple ID,
   password, then the 6-digit 2FA code.
2. **"Generate a new Apple Distribution Certificate?"** → **yes**. EAS creates and
   stores it. You get 2 distribution certificates per account — let EAS manage
   them rather than making your own, and never delete one Apple lists as in use.
3. **Bundle identifier registration** — EAS registers `com.ezzy.vendormobile` on
   the portal if it is not there yet.
4. **Provisioning profile** — an ad-hoc profile containing the devices from §2.

Answer yes to letting EAS manage credentials throughout. They are stored against
the project, so subsequent builds are non-interactive.

**Important:** a device added *after* a build is not in that build's profile. Add
the device, then rebuild.

iOS builds run on macOS workers, draw on the same free-tier monthly build
allowance as Android, and typically queue longer. Budget more than the 10–20 min
Android takes.

### Install it

The build page gives a QR code. Scan it with the iPhone camera and it installs
over the air. Then:

```bash
npx expo start --dev-client
```

Open **Ezzy Vendor** on the phone — not Expo Go, which cannot open this SDK at
all on iOS.

### Getting Metro to the phone — the one place iOS is worse than Android

**`adb reverse` has no iOS equivalent.** The USB trick in `EAS-SETUP.md` §6a does
not exist here, so you are down to two options:

```bash
npx expo start --dev-client --tunnel   # works through anything; slower
npx expo start --dev-client --lan      # only if the phone can reach this machine directly
```

Given the VPN-holding-the-default-route problem already documented for this
machine, **`--tunnel` is the realistic default on iOS.** It installs `@expo/ngrok`
on first use.

---

## 5. Standalone build — the iOS answer to the preview APK

```bash
npx eas-cli@latest build --profile preview --platform ios
```

`distribution: internal` produces an ad-hoc `.ipa` with the JS bundled in. No
Metro, no laptop — the direct equivalent of the preview APK, and the right thing
for confirming a fix on a real device.

**But it is not as portable as the APK.** An APK installs on any Android phone
that allows unknown sources. An ad-hoc `.ipa` installs **only** on the UDIDs
registered in §2. To hand a build to someone whose phone you have not registered,
you need TestFlight.

---

## 6. TestFlight — wider testing, and the road to submission

```bash
npx eas-cli@latest build --profile production --platform ios
npx eas-cli@latest submit --platform ios --latest
```

- `submit` will offer to create the **App Store Connect** app record if it does
  not exist. Let it.
- It will also offer to generate an **App Store Connect API key**. Prefer this
  over Apple-ID-password submission — it does not trip 2FA on every run and it
  keeps working in CI.
- `eas.json` has no `submit.production.ios` block yet. Not needed — the CLI
  prompts and can write it. Add `ascAppId` there afterwards to make future
  submissions non-interactive.
- The `production` profile already sets `autoIncrement: true` with
  `appVersionSource: "remote"`, so the iOS `buildNumber` is managed for you. Do
  not hand-edit build numbers.

**Internal** TestFlight testers (up to 100, must be on your ASC team) get builds
immediately with no review. **External** testers require a Beta App Review, which
is a real review — and it will want the privacy policy that **B6** says does not
exist yet.

---

## 7. Push notifications (Ph7) — same account, later

Not needed for any build above, but worth knowing the sequencing since it is the
main argument for a dev build over `eas go`:

- iOS push needs an **APNs key**, which EAS generates from the same Apple account
  the first time you build with push credentials. One key covers all your apps.
- `expo-notifications` **never** works in Expo Go on iOS. A development build is
  mandatory — which §4 just gave you.
- Still blocked on the non-Apple half: the `device_push_tokens` migration on the
  hosted project and the `send-push-notification` Edge Function.

---

## 8. What to expect to trip on

| Symptom | Cause |
|---|---|
| `eas device:create` profile won't install | Opened the link in Chrome. Must be Safari, then approve under Settings → General → VPN & Device Management |
| Build installs but immediately says "Untrusted Developer" | Approve the developer under Settings → General → VPN & Device Management |
| New tester's phone can't install the ad-hoc build | Its UDID was not in the provisioning profile. Register it (§2) and **rebuild** — re-sending the same link will not help |
| Dev build opens but never connects to Metro | No `adb reverse` on iOS. Use `--tunnel` (§4) |
| Apple login fails inside `eas build` | 2FA not enabled on the Apple ID, or you entered an app-specific password where the account password was wanted |
| Upload rejected for a missing privacy manifest | A dependency added one since; re-run the build with the current SDK, and check `ios.privacyManifests` |
| Every TestFlight upload asks about encryption | `ITSAppUsesNonExemptEncryption` got lost from `app.json` — it is currently set correctly |

---

## 9. Suggested order

1. **Start Apple enrolment now** — everything else is same-day, this is not.
2. While waiting: nothing to change in this repo. Optionally close **B5** (icon)
   and **B6** (privacy policy), since both block the store rather than the build,
   and B6 also blocks external TestFlight.
3. On approval: `device:create` → `build --profile development --platform ios` →
   `expo start --dev-client --tunnel`.
4. Run the D10-A verification pass on iOS that Android already got — both themes,
   largest Dynamic Type, VoiceOver over approve/reject, safe-area insets on a
   notched device, `expo-blur` on dark cards, and **shadows**, which are the most
   likely divergence since iOS `shadow*` and Android `elevation` were implemented
   separately.
5. `build --profile preview --platform ios` when you want a standalone build to
   sanity-check without a laptop.
6. TestFlight only when B5/B6 are closed.
