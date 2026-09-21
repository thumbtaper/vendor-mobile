# Native kiosk implementation addendum

Date: 2026-09-07
Overall status: IN PROGRESS

Status legend: ⬜ TODO · 🔄 IN PROGRESS · ✅ DONE · ⏸ PARKED · ✖ ABORTED.
Item numbers refer to the shared `2026-09-03-vendor-mobile-kiosk-mode` plan.
This app-local addendum records subsequent decisions without editing shared files.
For B2, the decision here supersedes the shared plan's server return bridge.

## B1 — API authentication ✅ DONE (2026-09-07)

Invalid/absent credentials returned 401 in staging probes. User verified web-cookie
lookup, selected-vendor mobile success and other-vendor mobile rejection (403).
The previously accepted vendor profile-join fix resolved the selected-vendor 500.
Removal of the temporary Settings probe remains TODO after the native flow is available.

## B2 — System browser with manual return 🔄 IN PROGRESS (2026-09-07)

User selected this approach to avoid further vendor changes. The existing payment API
receives only vendorId and bookingId and returns checkout_url/session_id. No new client
enum, server redirect route, native callback route, WebView or dependency is needed.

- Source: `src/services/kioskApi.ts` payment-session wrapper;
  `src/services/kioskPayment.service.ts` browser opener and scoped is_paid reader.
- Browser return is manual. Existing PayMongo redirects still lead to the vendor web
  kiosk URL; mobile does not assume that browser has a vendor session. Tell the customer
  before opening: “After paying, close the browser to return here.”
- PayMongo independently sends the webhook to the existing booker endpoint. Only a
  successful read of bookings.is_paid=true permits the paid UI. False means pending;
  inaccessible rows, offline errors and query failures mean status unavailable.
- Android openBrowserAsync resolves when the browser opens, not when it closes.
  I3's checkout hook must listen for foreground return; on iOS also refresh when the
  browser promise resolves. These events never create a payment or trigger a webhook.
- Keep booking UUID and checkout URL only in memory; never persist customer fields or
  payment status in the vendor's persistent query cache. Clear customer form/signature
  state before opening checkout. Retain only the pending booking reference across the
  browser excursion; discard it on staff exit, session loss, new customer or process death.
- During checkout, I1/I3 must not let the ordinary background/idle reset destroy the
  pending-reference state. On return, resume the idle reset and offer Check again while
  awaiting confirmation. Poll only while that result screen is active; stop on paid,
  reset, sign-out, background or unmount. Do not reopen/create checkout automatically.
- Browser launch failure leaves the booking unpaid; retry with the existing URL. Never
  roll back the booking or set is_paid from the client.

### Verification

✅ Service foundation machine checks (2026-09-07): mobile TypeScript, targeted ESLint
and diff validation passed. The services are not yet connected to a customer screen.
⬜ Wire these services into I3's native checkout hook/render/style components.
⬜ Android and iOS: successful sandbox payment, cancellation, delayed webhook, offline
return, browser-launch failure, external wallet excursion and repeat foreground events.
⬜ Ensure reset/session loss cannot display the previous customer's payment result.
No live payment or platform browser test has been performed for this stage yet.

## Remaining stages

- I1/I2 ⬜ TODO: main-menu Kiosk button, protected native route, password-confirmed
  exit, persistence and schedule-aware offering/slot reads.
- I3/I4 ⬜ TODO: native booking and identifier-only close-out flows, using B2 above.
- I5 ⬜ TODO: native signature capture; new dependency requires approval.
- B3 ⏸ PARKED: live settlement verification awaits confirmed webhook configuration
  and a sandbox payment proving the booking/ledger/notification transition.

## References

- Expo SDK 57 WebBrowser: https://docs.expo.dev/versions/v57.0.0/sdk/webbrowser/
- Existing web payment contract: `vendor/app/api/kiosk/payment/create-session/route.ts`.
- Shared behaviour: `architecture/booking-flow.md`, kiosk section.
