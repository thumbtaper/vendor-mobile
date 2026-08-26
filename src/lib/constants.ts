// Public configuration. Everything here is readable by anyone who unpacks the
// binary — `EXPO_PUBLIC_` values are inlined at build time. SUPABASE_SERVICE_ROLE_KEY
// must never appear in this app under any prefix (root AGENTS.md); this app has no
// service-role dependency at all (plan §2).

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Required values the bundle was compiled without. `EXPO_PUBLIC_*` is inlined at
// build time, so this is fixed for the life of the binary — an empty array is the
// only shippable state, and `app/_layout.tsx` renders ConfigErrorScreen otherwise.
//
// This deliberately does NOT throw. A module-scope throw is a red box in a
// development build but a *silent process death* in a release build, where there
// is no error overlay to catch it: the splash shows, the bundle fails to
// evaluate, and the process dies looking identical to a native crash. That cost a
// full build cycle to diagnose once (.plans/2026-07-28-vendor-mobile-preview-crash.md).
export const MISSING_CONFIG: string[] = [
  ...(url ? [] : ["EXPO_PUBLIC_SUPABASE_URL"]),
  ...(anonKey ? [] : ["EXPO_PUBLIC_SUPABASE_ANON_KEY"]),
]

// Placeholders keep `createClient` constructible when configuration is missing,
// so the error screen renders instead of the client throwing first. They are
// never used for a request: ConfigErrorScreen short-circuits above every provider
// that issues one, and `.invalid` is reserved by RFC 2606 so it cannot resolve
// even if that guarantee were ever broken.
export const SUPABASE_URL = url ?? "https://missing.invalid"
export const SUPABASE_ANON_KEY = anonKey ?? "missing"

// Same source as `app.config.js`'s `name`, so the in-app branding and the home
// screen label can never drift apart.
export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME ?? "Ezzy Vendor"

// The deployed vendor web portal. Mobile links out to it for the things that stay
// on the web: registration + KYC (D7-A). Not fatal if unset — the link is hidden
// rather than broken, since a link to nowhere is worse than no link at a store review.
export const WEB_PORTAL_URL = process.env.EXPO_PUBLIC_VENDOR_PORTAL_URL ?? null

export interface LegalLink {
  key: string
  label: string
  short: string
  href: string
}

/*
 * Legal URLs — UNCONDITIONAL CONSTANTS, never environment-gated.
 *
 * ⚠️ THIS IS THE WHOLE POINT OF B3. These used to hang off `WEB_PORTAL_URL`, so a
 * production build made without `EXPO_PUBLIC_VENDOR_PORTAL_URL` set shipped with **no
 * privacy link and no deletion link at all** — the two things both stores require in order
 * to accept a submission. A missing environment variable must never be able to remove them.
 *
 * Copied, not imported, from the vendor portal's `lib/legal.ts` per the cross-app
 * convention. Mobile displays the same seven policy documents but has no consent flow.
 *
 * ⚠️ TRAILING SLASHES ARE LOAD-BEARING, and two slugs are not the obvious ones.
 * `ezzy.ph/terms-use` (no slash) 301-redirects, `/account-deletion/` and `/delete-account/`
 * are 404s — the real deletion page is `/account-data-deletion/`. `/payment-policy/` is
 * singular. Verified 2026-08-23 in the web/account-deletion plan.
 */
export const LEGAL_LINKS: readonly LegalLink[] = [
  {
    key: "terms",
    label: "Terms of Use",
    short: "Terms",
    href: "https://ezzy.ph/terms-use/",
  },
  {
    key: "privacy",
    label: "Privacy Policy",
    short: "Privacy",
    href: "https://ezzy.ph/privacy-policy/",
  },
  {
    key: "acceptable",
    label: "Acceptable Use Policy",
    short: "Acceptable Use",
    href: "https://ezzy.ph/acceptable-use-policy/",
  },
  {
    key: "cookies",
    label: "Cookie Policy",
    short: "Cookies",
    href: "https://ezzy.ph/cookie-policy/",
  },
  {
    key: "refunds",
    label: "Refund & Cancellation Policy",
    short: "Refunds",
    href: "https://ezzy.ph/refund-cancellation-policy/",
  },
  {
    key: "deletion",
    label: "Account & Data Deletion",
    short: "Deletion",
    href: "https://ezzy.ph/account-data-deletion/",
  },
  {
    key: "payments",
    label: "Payment Policy",
    short: "Payments",
    href: "https://ezzy.ph/payment-policy/",
  },
]

export const PRIVACY_POLICY_URL =
  LEGAL_LINKS.find((link) => link.key === "privacy")?.href ??
  "https://ezzy.ph/privacy-policy/"
export const ACCOUNT_DELETION_URL =
  LEGAL_LINKS.find((link) => link.key === "deletion")?.href ??
  "https://ezzy.ph/account-data-deletion/"

// The portal this client acts as, matching the `notifications.portal` value the
// web app filters on (`vendor/services/notifications.service.ts`).
export const PORTAL = "vendor" as const

// Where the multi-vendor selection is remembered between launches (I3). Mirrors
// the web app's VENDOR_STORAGE_KEY.
export const VENDOR_STORAGE_KEY = "ezzy.vendor.selectedVendorId"
