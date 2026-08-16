// The getting-started guide's content.
//
// ⚠️ THIS IS DOCUMENTATION, AND IT DESCRIBES SCREENS THAT CHANGE. The web's
// equivalent states the rule this file now follows too: *when the UI changes,
// change this in the same commit.* It was not followed for the dashboard period
// work — the period control and the drill-down shipped in Stages 3–6 while this
// file still described the screens as they were before, and two of its claims had
// become false. Every claim below was re-checked against the code on 2026-08-14.
//
// Reference, NOT source: `vendor/components/dashboard/GuideModal/guideItems.ts`
// (it was `GuidePanel/` until vendor commit `fd7a62b` moved the web guide into a
// modal — this app keeps its hide/show panel, D3).
//
// SCOPED TO WHAT THE PHONE DOES, deliberately. The web list covers *Offerings*,
// *Staff* and *Schedule Management*, and tells vendors to "create sessions on the
// Schedule page" and that transaction "summary cards recount themselves from
// whatever the filters leave on screen". None of that is true here: those three
// screens do not exist in this app, and this app's totals come from a separate
// server query over the selected period rather than from the rows left on screen.
// A guide that sends a vendor looking for a Schedule page, or that describes
// numbers behaving in a way they do not, is worse than no guide. The closing note
// points at the portal for the rest — the same thing Settings already says.
//
// No React import: this is a data module, and the render layer is `GuideCard`.

import type { LucideIcon } from "lucide-react-native"
import {
  Bell,
  BookOpen,
  CircleCheckBig,
  Clock,
  LayoutDashboard,
  Wallet,
} from "lucide-react-native"

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
    Icon: LayoutDashboard,
    title: "This screen",
    color: "#3b82f6",
    // Now MATCHES web's two labelled groups and its Gross/Fee/Net/Payout split
    // (parity plan D1). Still not web's wording: its "Today's" card opens a
    // Calendar this app does not have, so mobile's opens Bookings instead.
    body: "Your numbers at a glance, in two groups. The period chips at the top drive both — except the two cards that say they ignore them. Tap any card to open the screen behind it.",
    actions: [
      {
        label: "Pending Approvals and Today's Bookings",
        meaning:
          "Ignore the period on purpose. Hiding a request because of a date filter would hide work you still have to do, and today is today.",
      },
      {
        label: "Completed, and everything under Earnings",
        meaning:
          "Follow the period you pick. Each group says which dates it counts by — Operations counts bookings by the day they are serviced, Earnings counts payments by the day the money came in, so the same dates can show different numbers without either being wrong.",
      },
      {
        label: "Tapping a card",
        meaning:
          "Opens the matching screen with the same period applied. Pending Approvals opens the Needs you group, which also holds returns waiting on you, so that list can be longer than the number you tapped.",
      },
    ],
  },
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
    // Rewritten: there are TWO chip rows here now, and the old single sentence
    // described neither the split nor the date row.
    body: "Every booking lives under the Bookings tab, under two rows of chips.",
    actions: [
      {
        label: "Top row — the stage a booking is at",
        meaning:
          "Groups bookings by what you have to do about them. The red badges count everything outstanding, whatever date filter is set, so they can never tell you there is less waiting than there is.",
      },
      {
        label: "Second row — the date it is booked for",
        meaning:
          "Starts on All dates, which is every booking. Pick a period to narrow it, or go back to All dates to see the lot again.",
      },
    ],
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
    //
    // The dashboard-agreement claim is now QUALIFIED. It used to read "The totals
    // at the top match the payout figure on your dashboard", which held only
    // because both screens were always locked to the current month. Each carries
    // its own period now, so the two agree when the periods agree — and a claim
    // about money agreeing between screens is not one to leave approximately true.
    // ⚠️ Names "Payout Released" specifically, not the Earnings group. Gross
    // Income is computed on a WIDER basis than this screen's Collected — it counts
    // money still held — so claiming the two screens agree in general would be
    // false. The one figure that does match exactly is the payout, which
    // `financials.test.ts` asserts.
    body: "What each payable booking earned you, after the platform fee. Its period chips work like the dashboard's, and Your payout matches the dashboard's Payout Released whenever both are set to the same range. Gross Income there is a bigger number on purpose — it also counts payments still on hold.",
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
