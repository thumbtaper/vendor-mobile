# Store submission reference — Bookdeck Vendor (mobile)

Prepared 2026-07-28 for Ph8. Everything below is either **verified against the code** or
**marked as outstanding**. The plan's §12 holds the reasoning; this file holds the answers
you transcribe into App Store Connect and Play Console.

> ⚠️ **Not submittable yet.** Three blockers stand between this document and an actual
> submission: **B5** (no brand assets), **B6** (no privacy policy URL anywhere in the
> product), **B7** (Play Console account type unknown → the 12-tester/14-day gate may apply).
> Details at the end.

---

## 1. App identity

| Field | Value | Status |
|---|---|---|
| Display name | Ezzy Vendor | resolved 2026-07-28 — sourced from `EXPO_PUBLIC_APP_NAME` via `app.config.js`, with `app.json` as fallback |
| Bundle ID (iOS) | `ph.ezzy.vendormobile` | set |
| Package (Android) | `ph.ezzy.vendormobile` | set |
| Deep-link scheme | `ezzyvendormobile://` | set |
| Devices | iPhone + Android phones, portrait only | `ios.supportsTablet: false` (D12-A) |
| Icons / splash | Real brand assets — white ZZ mark on `#034BFC`; splash on `#04060E` | done 2026-07-30, verified via `expo prebuild` |

**Screenshot sets required:** iPhone 6.9" and 6.5" (App Store), Android phone (Play).
**No iPad set is owed** — the app declares itself phone-only.

---

## 2. Permissions — verified against a real `expo prebuild`

The app-level manifest was generated and inspected on 2026-07-28, then the native directory
was removed to keep the managed workflow.

| Permission | Source | Ships in release? | Justification |
|---|---|---|---|
| `INTERNET` | core | yes | All data comes from Supabase |
| `VIBRATE` | expo-haptics / notifications | yes | Approve/reject haptic confirmation |
| `POST_NOTIFICATIONS` | expo-notifications | yes | Booking alerts (Android 13+) |
| `RECEIVE_BOOT_COMPLETED` | expo-notifications | yes | Restores scheduled notifications after reboot |
| `SYSTEM_ALERT_WINDOW` | React Native **debug** manifest | **no** | Dev menu overlay; debug variant only |
| `READ/WRITE_EXTERNAL_STORAGE` | expo-file-system (transitive via `expo`) | **no — blocked** | The app never touches user files; removed via `android.blockedPermissions` |

**Two caveats on this check:**
1. `expo prebuild` emits the **app-level** manifest, not the fully merged one. Library
   manifests (including `POST_NOTIFICATIONS`) merge during Gradle. **Confirm the real merged
   manifest from a release build** before submitting — that is the artefact review sees.
2. Re-run this check after **every** dependency addition. Two unused storage permissions
   arrived without being asked for; that is the normal case, not an anomaly.

**No camera, location, contacts, photo or microphone permission.** KYC being out of scope
is a compliance asset — keep it that way.

---

## 3. Google Play — Data safety form

**Data collected and linked to the user:**

| Type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| Email address | yes | no | Account management, authentication | Required |
| Name (booker) | yes | no | App functionality — displayed on bookings the vendor manages | Required |
| Phone (booker) | yes | no | App functionality — vendor contacts the booker | Required |
| **Purchase/transaction history** | yes | no | App functionality — payout and fee ledger | Required |
| Device ID (Expo push token) | yes | no | App functionality — booking notifications | Optional (only if push is enabled) |
| Crash logs / diagnostics | no | — | — | — |

- **Encrypted in transit:** yes (HTTPS to Supabase throughout).
- **Users can request deletion:** yes — via the web portal (**needs the B6 URL**).
- **Note the asymmetry:** booker name/phone/email are other people's PII, displayed to the
  vendor as business data. Both stores still count that as collection. Declare it.
- **Financial info is a sensitive category on Play** — the transactions screen means this
  cannot be skipped.

**Other Play declarations:** target API 36 (verified — SDK 57's default via
`expo-modules-core`, so no `expo-build-properties` pin is needed) · 16 KB page sizes
satisfied by RN 0.86 · no ads · no in-app purchases · content rating: business/utility, no
UGC.

---

## 4. Apple — privacy nutrition labels & review notes

**Nutrition labels** mirror §3: Contact Info (email, name, phone), Financial Info (purchase
history), Identifiers (device ID, only when push is enabled). All "linked to you", none used
for tracking. **No `NSPrivacyTracking`.**

**Privacy manifest** (`ios.privacyManifests` in `app.json`) declares the required-reason APIs
the storage libraries use: `UserDefaults` (CA92.1) and file timestamp (C617.1).

**Export compliance:** `ITSAppUsesNonExemptEncryption: false` — HTTPS and OS keychain only,
no bundled cryptography.

**Sign in with Apple:** not required. The app has email/password only and no third-party or
social login. **Adding any social login later makes SIWA mandatory** — treat it as a scope
change.

**In-app purchase:** none. Bookings are real-world services paid for on the web
(Guideline 3.1.3(e)). The transactions screens display money but sell nothing, and carry no
purchase link.

### Review notes — draft to paste into App Store Connect

> Bookdeck Vendor is a companion app for businesses that already have a vendor account on
> the Bookdeck platform. It is used by service providers to approve or reject customer
> bookings, review their payout ledger, and receive notifications when a booking needs
> attention.
>
> Accounts are created on our web portal, which includes a document-verification step that
> is not part of this app. Please use the demo account below, which is pre-configured with
> pending bookings so the approve/reject flow can be exercised.
>
> Demo account: <EMAIL> / <PASSWORD>
>
> Push notifications alert the vendor to new bookings while the app is closed. The app does
> not sell digital goods; all payments happen on the web for real-world services.

**Guideline 4.2 (minimum functionality)** is this app's main rejection risk. The defence is
push (Ph7), the offline cache, haptics and native list performance — and the review notes
above, which name the audience rather than leaving the reviewer to guess.

---

## 5. Demo account — required, not yet created

Apple **will** reject a login-walled app without working credentials (Guideline 2.1).

Requirements:
- A real vendor-admin account on the **production** Supabase project.
- Its vendor must be `active` — a `pending_activation` account lands on the blocked screen
  and the reviewer sees nothing else.
- At least **3 bookings in `pending`** so approve *and* reject can both be exercised.
- At least one paid booking so Transactions is not empty.
- At least one notification.
- **It must survive a `db reset`.** Seed it or protect it; a wiped demo account mid-review
  is an automatic rejection.

---

## 6. Blockers before submission

### B5 — brand assets — **binary assets DONE, listing assets outstanding**
**Resolved 2026-07-30 (icon + splash):** real artwork generated from a vector source and
wired into `app.json` — iOS 1024² icon (alpha-free), Android adaptive foreground +
monochrome on a `#034BFC` background colour, and the splash on `#04060E`. Every Expo
template artifact is deleted. Verified through a real `expo prebuild`, Android only.
Regenerate with `node scripts/generate-brand-assets.js`; see
`.plans/2026-07-30-vendor-mobile-brand-assets.md`. **Display name resolved 2026-07-28** —
"Ezzy Vendor".

**Still outstanding — these are *listing* assets, not binary assets, and still block
submission:** screenshots (iPhone 6.9" + 6.5", Android phone) and the short + full store
descriptions. Play also wants a 512² store icon and a 1024×500 feature graphic, both
derivable from the same master.

**The iOS icon has never been seen rendered** — no Apple Developer membership, so no iOS
build exists (**B9**). It is asserted correct (1024², no alpha channel), not visually
confirmed.

### B6 — no privacy policy or deletion route exists
Verified absent from the whole `vendor` product. **Both stores block submission without a
reachable privacy policy URL**, and Play's data-deletion policy expects a deletion URL.
Settings currently links to the portal root as the D13-A fallback; it must point at a real
deletion route before submission. This is work in another app.

### B7 — Play Console account type unknown
If the Console account is a **personal** account created after 13 Nov 2023, a closed test
with **12 testers opted in for 14 continuous days** is required before production access.
Organisation accounts are exempt. **This is wall-clock time — start it during Ph7, not
after.**

### Also outstanding (Ph7)
Apply the push migration, deploy the Edge Function, set the Vault secret, upload FCM v1 and
APNs credentials, and test push on physical devices.
