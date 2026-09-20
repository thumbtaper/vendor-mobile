# Kiosk Verification

Status: Android kiosk containment, catalogue, customer, signature, close-out and
media/guide acceptance passed by user confirmation through 2026-09-20. Payment and
receipt code is machine-verified; its live payment acceptance remains open. iOS
acceptance remains deferred at the user's request.

The development build has a Kiosk Mode main-menu entry, launch confirmation,
persisted vendor selection, a root route outside staff tabs, password-verified staff
exit, customer booking, PayMongo handoff, receipt polling and Finish a booking. The
remaining release gate is live payment/receipt acceptance, not a missing mobile flow.

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

Status: Android acceptance DONE (2026-09-14), based on the user's confirmation
that Stage 4 passes and all checks are complete. iOS acceptance remains deferred.

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
- [x] Verify live customer entry, keyboard, large text, light/dark and TalkBack.
- [x] Verify no-document, inline-document and uploaded-document offerings.
- [x] Verify links, failed signing/retry, four-minute refresh and expired links.
- [x] Verify a short browser visit preserves fields; a visit over ten minutes,
  ordinary backgrounding, idle reset, access loss and staff exit clear them.
- [x] Verify returning to slot selection clears the customer form.

No booking or payment is created. Signature capture is Stage 5; checkout is Stage 6.
Live acceptance is user-reported, not agent-operated or supported by new screenshots.
It supersedes the earlier emulator-connection blocker. The successful export re-run
supersedes the interrupted run's missing exit status. iOS remains deferred and the
shared plan has not been edited. Stage 3's separate live acceptance is not inferred
from the Stage 4 confirmation.

## Remaining Boundaries

Android screen pinning and iOS Guided Access are separate OS controls. This app
does not lock the device or suppress OS-delivered background notifications.

iOS lifecycle, keyboard, accessibility, and navigation checks remain unverified.
Catalogue, customer details, document review, native signature capture, payment/receipt
and close-out are connected for development testing. Document and payment browser
handoffs use manual browser return; live payment settlement remains Stage 6 acceptance.

## Stage 3: Catalogue and Schedules

Status: Android acceptance DONE (2026-09-16), based on the user's explicit
Stage 3 sign-off after verifying time selection and Continue. Implementation and
regression checks are complete. iOS acceptance remains deferred; the shared plan
is unchanged. This is user-reported acceptance, not agent-operated verification.

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
- [x] Android visual acceptance: catalogue/photos, picker, light/dark, largest text
  (user stage sign-off; no new screenshots supplied).
- [x] Live schedule cases: one-off/weekly/biweekly/monthly, 24-hour and overnight;
  confirm an after-midnight slot shows the following calendar date.
- [x] Full slots and quantity limits match vendor web for the same schedule/data.
- [x] Rapid date switches and offline/retry never show stale capacity as available.
- [x] Background, idle reset and staff exit clear the picker; interaction prevents
  idle reset. Periodic access rechecks must not reset an actively used picker.
- [x] List/detail show actual overnight end dates without an incorrect day count.

Live checklist closure above records the user's overall Stage 3 acceptance on
2026-09-16; individual fixture results were not separately supplied. Selecting an
available time reveals Quantity and Continue below Refresh availability. The
60-second availability refresh clears the time selection, which must be reselected.

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

2026-09-15 close-out attempt: all 22 current Node test files, TypeScript and full
source ESLint passed, including occurrence/window/capacity/history regressions.
ADB reported no devices and the screenshot attempt returned device not found;
live checks could not be completed by the agent. No database fixtures were modified.
The user's 2026-09-16 acceptance supersedes that pending Android acceptance status.

## Stage 5: Native Signature Capture

Status: Android acceptance DONE (2026-09-16), based on the user's explicit
Stage 5 sign-off. Client implementation and machine checks are complete.
Stage 6 server-integration evidence remains open; iOS is deferred, not passed.

- [x] `KioskSignature/*` follows render/hook/themed-style separation. The existing
  `react-native-svg` dependency captures a PNG; no new dependency, permission,
  schema, backend, or release-version change was needed.
- [x] Customer form inserts capture only for active signature-required documents.
  No-document and agreement-only offerings skip capture; multiple signed
  documents share one capture. Existing all-document-version agreement gating stays.
- [x] Pad supports finger/stylus input, clear/redraw, fixed-coordinate strokes,
  dark-on-white export in either theme, and an in-memory PNG preview.
- [x] Empty input cannot continue. Input has a 4096-point cap; PNG output has
  bounded base64 length/dimensions and a PNG/IHDR header check. Export timeout,
  clear and unmount invalidate stale callbacks; no signature is logged or stored.
- [x] Going back clears the captured PNG; returning to slots unmounts the form.
  Existing background/idle/access-loss resets also unmount capture. Shell touch
  movement counts as activity so continuous drawing does not trigger idle reset.
- [x] Labelled 44-point clear button and Signature assistance action; assistance
  directs the customer to staff without faking a signature or bypassing consent.
- [x] TypeScript, full source ESLint and all 22 Node test files passed. New tests
  cover PNG normalisation/bounds, coordinate scaling/clamping and document flags.
- [x] Final Android bundle export passed (3986 modules, exit 0) on 2026-09-15,
  output `/tmp/ezzy-vendor-stage5-final-export`, dotenv disabled. This proves
  bundling only, not native PNG capture or live API configuration.
- [x] Android: draw, confirm the PNG preview, clear/redraw, and confirm a blank
  pad cannot proceed. Check a single tap/mark as well as several strokes.
- [x] Android: compare no-document, agreement-only, one signed document and
  multiple signed documents. Ensure required agreements cannot be skipped.
- [x] Android: verify light/dark, large text, TalkBack/staff assistance, rotation
  and that drawing does not scroll the page (user sign-off; no screenshots supplied).
- [x] Android: back, idle, ordinary background, access loss and staff exit clear
  the signature. Return for another customer and confirm no prior ink remains.
- [ ] Stage 6 integration: send the bare PNG only in the booking request, with
  the signer name; verify distinct server acknowledgement rows share the signature
  path for multiple signed documents. No direct mobile signature upload.

The captured PNG stays only in `KioskCustomerForm` memory until the final booking
request; it is never logged or directly uploaded by the mobile client. Android
checklist closure records the user's Stage 5 acceptance on 2026-09-16; persistence
and acknowledgement-row evidence remain part of Stage 6 live acceptance.

## Stage 6: Checkout and Receipt

Status: IN PROGRESS (2026-09-20). User approved manual browser return and no
vendor changes. D6 is resolved locally: retain existing web checkout URLs, close
the browser manually, then read payment truth through vendor-scoped RLS. The
checkout now refreshes when the app returns to foreground and renders a distinct
confirmed receipt after the webhook has settled.

Implementation checklist:
- [x] Wire the confirmed selection/customer/agreements/signature to the existing
  booking endpoint at the final explicit action. Keep all customer data in memory.
- [x] Add `KioskCheckout` render/hook/themed styles for review, creation, payment,
  pending/error/paid receipt states, status recheck and Done.
- [x] Bound browser handoff to ten minutes, hide the customer surface while away,
  recheck access on return and retain ordinary background/idle/session reset rules.
- [x] Select real receipt amount, status, offering, booking reference and overnight span,
  scoped to booking id, pinned vendor and kiosk origin. No zero fallback on errors.
- [x] Prevent repeat writes in the same flow, including after ambiguous errors;
  reopen only an already-known checkout URL. Do not infer paid/cancelled from close.
- [x] Re-read payment truth on foreground return and render paid/free confirmation
  separately from pending or refunded receipts.
- [x] Run TypeScript, source lint, regression tests and Android export (25 test
  files passed; Android export passed with 3998 modules on 2026-09-20).

Machine verification above is complete. The app-only implementation added
`src/components/kiosk/KioskCheckout/*`, `src/lib/kioskCheckout*`, the shared
manual-return browser helper and the vendor-scoped receipt read. No vendor,
schema, dependency or webhook changes were made.

Live acceptance remains required: free and paid booking, manual browser close,
pending/delayed webhook, network failure, duplicate taps, actual receipt values,
signature acknowledgement rows, exactly one customer email, lifecycle/privacy
reset, themes, large text and TalkBack. iOS remains deferred. Existing staging
webhook is reused; no additional webhook or vendor deployment is proposed.

The parity plan records K5 as code-complete with live payment acceptance outstanding.
This checklist records Android acceptance where supplied and the iOS deferral, not
full cross-platform completion or release readiness.
