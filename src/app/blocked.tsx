import { BlockedActions } from "@/components/common/BlockedNotice/BlockedActions"
import { BlockedNotice } from "@/components/common/BlockedNotice/BlockedNotice"
import { AuthScreen } from "@/components/common/AuthScreen/AuthScreen"
import { useSessionGate } from "@/providers/SessionGateProvider"

export default function BlockedScreen() {
  const { gate } = useSessionGate()

  return (
    <AuthScreen>
      <BlockedNotice reason={gate.blockedReason ?? "no_access"}>
        <BlockedActions />
      </BlockedNotice>
    </AuthScreen>
  )
}
