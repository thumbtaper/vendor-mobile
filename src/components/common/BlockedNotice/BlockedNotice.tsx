import { BadgeCheck, Clock, FileText, ShieldOff, UserX } from "lucide-react-native"
import { useMemo } from "react"
import { Text, View } from "react-native"

import type { BlockedReason } from "@/hooks/useVendorGate"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./BlockedNotice.styles"

// Pure display — no state, no effects, no handlers (actions are passed in as
// children). Per `component-separation` §4 that means no companion hook.
//
// The copy is the point of this component. Each state tells the user what is
// true and what happens next; "you don't have access" with no explanation is the
// dead end that gets an app rejected at review (D5-A, §12.1 S3).
//
// The first two reasons and the revised `pending_activation` copy come from plan
// .plans/2026-09-30-vendor-signup-before-kyc.md (M1): the app now opens only for an
// active vendor whose KYC is approved. There is no KYC form in this app — verification
// happens on the web portal, which the "Open the web portal" action below leads to.
const COPY: Record<BlockedReason, { title: string; body: string }> = {
  verification_required: {
    title: "Verify your business to continue",
    body: "Before you can use the app, our team needs to verify your business. Open the web portal to submit your verification documents — or to resubmit them if we asked for changes. You'll be able to sign in here once your business is verified and activated.",
  },
  verification_in_review: {
    title: "Your documents are under review",
    body: "Our team reviews each business by hand, so this isn't instant. We'll email you as soon as there's a decision, and you'll be able to sign in here once your business is verified and activated.",
  },
  pending_activation: {
    // Was "under review / verifying your documents". Since M1 this reason means the
    // documents are already APPROVED and only activation is outstanding.
    title: "Your business is verified",
    body: "Your documents are approved. Activation is a separate step by our team — we'll email you as soon as it's done, and you'll be able to sign in here then.",
  },
  suspended: {
    title: "This vendor account is suspended",
    body: "Access has been paused. Contact support through the web portal to find out why and what's needed to restore it.",
  },
  no_access: {
    title: "No vendor access on this account",
    body: "You're signed in, but this account isn't an administrator for any vendor. If you've just registered, finish setting up on the web portal first.",
  },
}

export function BlockedNotice({
  reason,
  children,
}: {
  reason: BlockedReason
  children?: React.ReactNode
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const copy = COPY[reason]

  const Icon =
    reason === "verification_required" ? FileText
      : reason === "verification_in_review" ? Clock
        : reason === "pending_activation" ? BadgeCheck
          : reason === "suspended" ? ShieldOff
            : UserX

  return (
    <View style={styles.wrapper}>
      <View style={styles.iconRing}>
        <Icon size={28} color={tokens.text} />
      </View>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  )
}
