# Kiosk Stage 2 Verification

Status: Android Stage 2 acceptance passed by user confirmation; iOS acceptance
deferred at the user's request (2026-09-12).

The development build has a Kiosk Mode main-menu entry, launch confirmation,
persisted vendor selection, a root route outside staff tabs, and password-verified
staff exit. Production launch remains disabled until the customer booking and
finish-booking flows are usable. Book something now opens the read-only Stage 3
catalogue and picker; Finish a booking remains disabled. No booking or payment is
created from the picker. This is not a release-ready kiosk.

## Android Acceptance

Use the development client with Metro serving the current mobile workspace.
Enter credentials only in the app, never in logs, screenshots, or chat.

- [x] Open Kiosk Mode from the main menu. Confirm the correct vendor, eligible
  offering count, exclusion reasons, Cancel, and Start kiosk are displayed.
- [x] Start kiosk. Confirm no staff tabs, Settings gear, or booking roster appear.
- [x] Press Android Back. Staff navigation must remain inaccessible.
- [x] Close and reopen the app. It must restore kiosk without flashing staff UI.
- [x] Follow a staff booking or Settings deep link while in kiosk. It must not
  expose the staff screen.
- [x] Check a notification tap when one is available.
- [x] Wrong staff password is rejected and kiosk stays active.
- [x] Keep the staff dialog open more than a minute and confirm it remains usable.
- [x] Background during password verification keeps kiosk contained (user report).
- [x] Submit the correct password, then immediately background the app while the
  request is pending. Return to the app: kiosk must remain active; retry explicitly.
- [x] Submit the correct password without backgrounding. The app must return to
  the staff dashboard and remain outside kiosk after reopening.
- [x] Return to kiosk, disconnect the network, then background and foreground the
  app. Verify the unavailable panel, Retry, and Staff sign-in; reconnect and retry.
- [x] Repeat with an expired or revoked test-account session. Staff screens must
  remain inaccessible until successful staff authentication and exit.
- [x] Check light/dark themes, largest system text, keyboard layout, and TalkBack.

User-reported Android checks recorded 2026-09-12. The user subsequently confirmed
correct-password exit, both themes, and all remaining Android checks, including the
known-correct-password background case. This supersedes the earlier forgotten-password
blocker. No new screenshots or agent-operated device verification were supplied.

## Deferred iOS Acceptance

Deferred, not passed, at the user's request on 2026-09-12. The user may use an
EAS-built iOS development client for later testing. Complete equivalent launch,
relaunch, staff exit, deep-link/notification containment, interrupted verification,
offline/session recovery, theme, large-text, keyboard, and VoiceOver checks before
an iOS release. Android Back is Android-specific; verify iOS navigation gestures
cannot expose staff content instead. A successful EAS build alone is not acceptance.

## Stage 4: Customer and Agreements

Status: IN PROGRESS (2026-09-14). Code implemented; live acceptance pending.

- [x] Customer name and email required; Philippine mobile optional but validated
  when supplied. Inputs disable autofill; values stay in component memory.
- [x] Customer and agreements screens follow the render/hook/themed-style split
  in `KioskCustomerForm/*` and `KioskAgreements/*`.
- [x] Active written documents render inline; uploaded documents use five-minute
  signed URLs, refreshed every four minutes. Failed refresh retains the last good
  link, with expiry checked before opening. Errors offer retry and staff help.
- [x] All document versions must be agreed; opening a file is not a prerequisite
  to ticking its agreement. Photos never create agreement steps.
- [x] Document/legal browser handoffs hide the form, pause idle reset for at most
  ten minutes and recheck access on return. Ordinary backgrounding still resets.
- [x] Pure regression tests cover required fields, PH mobile spelling/validation,
  document-version agreement, review deadline and allowed HTTPS origins. All 21
  Node test files passed during implementation; TypeScript passed on resume.
- [x] Android export re-run passed on 2026-09-14 (3982 modules, exit 0), with
  dotenv disabled. This verifies bundling, not live configuration or document access.
- [ ] Verify live customer entry, keyboard, large text, light/dark and TalkBack.
- [ ] Verify no-document, inline-document and uploaded-document offerings.
- [ ] Verify links, failed signing/retry, four-minute refresh and expired links.
- [ ] Verify a short browser visit preserves fields; a visit over ten minutes,
  ordinary backgrounding, idle reset, access loss and staff exit clear them.
- [ ] Verify returning to slot selection clears the customer form.

No booking or payment is created. Signature capture is Stage 5; checkout is Stage 6.
The latest emulator screenshot showed a staff screen with "Cannot connect to Expo
CLI", not the new customer flow, so it is not Stage 4 visual evidence. On the
2026-09-14 verification attempt, ADB listed no connected devices; live checks remain
pending until the emulator is available. The successful export re-run supersedes
the interrupted run's missing exit status. iOS remains deferred and the shared
plan has not been edited.

## Remaining Boundaries

Android screen pinning and iOS Guided Access are separate OS controls. This app
does not lock the device or suppress OS-delivered background notifications.

iOS lifecycle, keyboard, accessibility, and navigation checks remain unverified.
Catalogue, customer details, documents, signatures, payments, and close-out are
later plan stages. Intentional document/payment browser handoffs will need their
own lifecycle handling before those flows are enabled.

## Stage 3: Catalogue and Schedules

Status: IN PROGRESS (2026-09-13). Implementation added; live Android acceptance
pending. iOS acceptance remains deferred. The shared plan is unchanged.

- [x] Port vendor occurrence, window, slot, eligibility and pagination rules/tests.
- [x] Add active offering, schedule and attachment reads through existing RLS.
  Occupancy is vendor-scoped, paged across the occurrence and following day,
  selects no customer fields, and rejects incomplete results.
- [x] Connect Book something to offering photos and a seven-day Manila-date picker.
  Date/time choices wrap instead of introducing stacked horizontal menus.
- [x] Display post-midnight dates, disable full slots, and limit quantity by every
  covered slot, the window boundary, and the existing web maximum of 12.
- [x] Preserve exact-midnight history formatting; distinguish overnight timed
  bookings from inclusive multi-day bookings.
- [x] Add agreement-flag, calendar-order, full-day, capacity and DST regression tests.
- [x] TypeScript, full source ESLint and all 20 Node test files passed.
- [x] Android bundle export passed (3973 modules). Export ran with dotenv disabled
  and proves bundling only, not live configuration or API access.
- [ ] Android screenshots: catalogue/photos, picker, light/dark, largest text.
- [ ] Live schedule cases: one-off/weekly/biweekly/monthly, 24-hour and overnight;
  confirm an after-midnight slot shows the following calendar date.
- [ ] Full slots and quantity limits match vendor web for the same schedule/data.
- [ ] Rapid date switches and offline/retry never show stale capacity as available.
- [ ] Background, idle reset and staff exit clear the picker; interaction prevents
  idle reset. Periodic access rechecks must not reset an actively used picker.
- [ ] List/detail show actual overnight end dates without an incorrect day count.

Implementation files: `src/components/kiosk/KioskCatalogue/*` keep render, hook,
and themed styles separate; `KioskShell` composes the picker and owns containment.
`src/services/kiosk.service.ts` owns reads; `src/lib/kioskCatalogue.ts` and the
ported modules own pure rules. No customer form, booking creation, payment,
schema/dependency changes, or sibling-app edits are included.

Mobile adaptation: slot comparisons use timezone-independent calendar coordinates
instead of device-local elapsed time, preventing DST from moving a post-midnight
slot onto the wrong day. Date choices use the existing Manila-date helper.
Successful creation under the following `booked_date` and receipt inspection require
the later checkout stage; Stage 3 verifies selection/read models only.

The shared plan at `../.plans/2026-09-03-vendor-mobile-kiosk-mode.md` still lists
Stage 2 as TODO. Updating that file requires separate approval under this app's
write-boundary instructions. This checklist records Android acceptance and the iOS
deferral, not full cross-platform completion or release readiness.
