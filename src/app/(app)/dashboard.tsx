import { ScreenShell } from "@/components/common/ScreenShell/ScreenShell"
import { DashboardView } from "@/components/dashboard/DashboardView/DashboardView"
import { SettingsAction } from "@/components/layout/SettingsAction/SettingsAction"
import { useSessionGate } from "@/providers/SessionGateProvider"

export default function DashboardScreen() {
  const { gate } = useSessionGate()

  return (
    <ScreenShell
      title="Dashboard"
      subtitle={gate.selectedVendorName}
      action={<SettingsAction />}
    >
      <DashboardView />
    </ScreenShell>
  )
}
