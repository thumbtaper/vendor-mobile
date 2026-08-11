// The getting-started guide's content.
//
// Ported from `vendor/components/dashboard/GuidePanel/guideItems.ts` — but NOT
// copied. The web list covers *Schedule Management*, *Offerings & Staff*, "the
// Schedule page" and "the booker booking wizard". **None of those screens exist
// in this app.** Its tabs are Dashboard, Bookings, Transactions, Notifications
// and Settings, and a guide that sends a vendor looking for a Schedule page is
// worse than no guide at all. So the list below is scoped to what the phone
// actually does, and the closing note points at the portal for the rest — which
// is the same thing Settings already tells them.
//
// No React import: this is a data module, and the render layer is `GuideCard`.

import type { LucideIcon } from "lucide-react-native"
import { Bell, BookOpen, CircleCheckBig, Clock, Wallet } from "lucide-react-native"

import { BOOKING_ACTIONS } from "@/lib/bookingActionCopy"

export interface GuideItem {
  Icon: LucideIcon
  title: string
  body: string
  /** Accent for the left rule and the icon chip. Decoration only — never the
   *  sole carrier of meaning, which is why every item also has a title. */
  color: string
  /** Optional glossary under the body, where one paragraph cannot carry several
   *  distinct actions. */
  actions?: { label: string; meaning: string }[]
}

export const GUIDE_ITEMS: GuideItem[] = [
  {
    Icon: Clock,
    title: "Pending approvals",
    color: "#f59e0b",
    body: "New booking requests land here first. Open one to see who it's from and what they booked, then approve or reject it. The customer is told either way.",
  },
  {
    Icon: BookOpen,
    title: "Bookings and filters",
    color: "#10b981",
    body: "Every booking lives under the Bookings tab. The chips across the top filter by the stage a booking is at, and the badge on each one counts how many are waiting on you.",
  },
  {
    Icon: CircleCheckBig,
    title: "Completing a booking",
    color: "#06b6d4",
    body: "A booking is only finished once both you and the customer say so. Your payout is released at that point, not before.",
    // Derived, never retyped — the button, its "i" sheet and this list all read
    // the same table. Filtered to the fulfilment stage: the table also carries
    // Approve and Reject, which belong to the START of a booking's life and would
    // be wrong under this heading. Same filter as the web guide panel.
    actions: BOOKING_ACTIONS.filter((a) => a.stage === "fulfilment").map(
      ({ label, meaning }) => ({ label, meaning }),
    ),
  },
  {
    Icon: Wallet,
    title: "Transactions",
    color: "#6366f1",
    // "After the platform fee" is checked, not assumed: the Transactions screen
    // shows `payout_amount` under the sub-label "After platform fee"
    // (`TransactionSummaryCards.tsx`), and the service selects
    // `platform_fee_amount` and `payout_amount` separately.
    body: "What each payable booking earned you, after the platform fee. The totals at the top match the payout figure on your dashboard.",
  },
  {
    Icon: Bell,
    title: "Notifications",
    color: "#3b82f6",
    body: "New requests and customer updates arrive here, and as a push notification too if you've turned those on in Settings.",
  },
]

// The tip is deliberately something the vendor can act on FROM THIS APP. The
// web's tip is about keeping offerings and staff specialisations current, which
// is not possible on the phone — repeating it here would be advice with no
// button attached.
export const GUIDE_TIP = {
  title: "Tip",
  body: "Turn on push notifications in Settings so new requests reach you without having to open the app.",
  color: "#6366f1",
}

export const GUIDE_FOOTNOTE =
  "Schedules, offerings and staff are managed on the web portal."
