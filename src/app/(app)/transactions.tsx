import { ScreenShell } from "@/components/common/ScreenShell/ScreenShell"
import { SettingsAction } from "@/components/layout/SettingsAction/SettingsAction"
import { TransactionsView } from "@/components/transactions/TransactionsView/TransactionsView"
import { useSessionGate } from "@/providers/SessionGateProvider"

export default function TransactionsScreen() {
  const { gate } = useSessionGate()

  return (
    <ScreenShell
      title="Transactions"
      subtitle={gate.selectedVendorName}
      action={<SettingsAction />}
    >
      <TransactionsView />
    </ScreenShell>
  )
}
