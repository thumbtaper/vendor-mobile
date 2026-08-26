// The getting-started guide's content.
//
// ⚠️ THIS IS DOCUMENTATION, AND IT DESCRIBES SCREENS THAT CHANGE. The web's
// equivalent states the rule this file follows too: when the UI changes, change
// this in the same commit.
//
// Reference, NOT source: `vendor/components/dashboard/GuideModal/guideItems.ts`.
// This mobile guide is scoped to what the phone does; web-only Offerings, Staff
// and Schedule Management stay in the web portal guide.

import type { LucideIcon } from "lucide-react-native"
import {
  Bell,
  BookOpen,
  CircleCheckBig,
  Clock,
  DoorOpen,
  LayoutDashboard,
  Wallet,
} from "lucide-react-native"

import { BOOKING_ACTIONS } from "@/lib/bookingActionCopy"
import { ACCOUNT_DELETION_URL } from "@/lib/constants"

export interface GuideItem {
  Icon: LucideIcon
  title: string
  body: string
  color: string
  actions?: { label: string; meaning: string }[]
}

export const GUIDE_ITEMS: GuideItem[] = [
  {
    Icon: LayoutDashboard,
    title: "This screen",
    color: "#3b82f6",
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
    body: "Every booking lives under the Bookings tab. Use the Status and Dates buttons to choose the work group and booking dates you want to see.",
    actions: [
      {
        label: "Status — the stage a booking is at",
        meaning:
          "Groups bookings by what you have to do about them. The red badges count everything outstanding, whatever date filter is set, so they can never tell you there is less waiting than there is.",
      },
      {
        label: "Dates — the date it is booked for",
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
    actions: BOOKING_ACTIONS.filter((a) => a.stage === "fulfilment").map(
      ({ label, meaning }) => ({ label, meaning }),
    ),
  },
  {
    Icon: Wallet,
    title: "Transactions",
    color: "#6366f1",
    body: "What each payable booking earned you, after the platform fee. Its period chips work like the dashboard's, and Your payout matches the dashboard's Payout Released whenever both are set to the same range. Gross Income there is a bigger number on purpose — it also counts payments still on hold.",
  },
  {
    Icon: Bell,
    title: "Notifications",
    color: "#3b82f6",
    body: "New requests and customer updates arrive here, and as a push notification too if you've turned those on in Settings.",
  },
  {
    Icon: DoorOpen,
    title: "Closing your account",
    color: "#64748b",
    body: "Settings has a Delete account row that opens Ezzy's Account & Data Deletion page. The signed-in closure request still happens on the vendor web portal, where you can choose what to close and confirm the business name before anything is sent for review.",
    actions: [
      {
        label: "Before you can close",
        meaning:
          "Open bookings, unreleased payouts and active disputes have to be settled first. The portal explains what is blocking the request and what clears it.",
      },
      {
        label: "What is removed",
        meaning:
          "Login credentials, contact details, addresses and verification documents are removed when closure completes.",
      },
      {
        label: "What is kept",
        meaning:
          "Booking, payout, fee, tax and dispute records can be retained where Ezzy is required to keep them. The full policy is on ezzy.ph.",
      },
      {
        label: "Where to read it",
        meaning: ACCOUNT_DELETION_URL,
      },
    ],
  },
]

export const GUIDE_TIP = {
  title: "Tip",
  body: "Turn on push notifications in Settings so new requests reach you without having to open the app.",
  color: "#6366f1",
}

export const GUIDE_FOOTNOTE =
  "Schedules, offerings and staff are managed on the web portal."
