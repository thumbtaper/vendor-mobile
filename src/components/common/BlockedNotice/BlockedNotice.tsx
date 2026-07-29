import { Clock, ShieldOff, UserX } from "lucide-react-native"
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
const COPY: Record<BlockedReason, { title: string; body: string }> = {
  pending_activation: {
    title: "Your vendor account is under review",
    body: "We're verifying your registration documents. You'll be able to sign in here as soon as it's approved — we'll email you when that happens.",
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
    reason === "pending_activation"
      ? Clock
      : reason === "suspended"
        ? ShieldOff
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
