import { ScreenShell } from "@/components/common/ScreenShell/ScreenShell"
import { NotificationsList } from "@/components/notifications/NotificationsList/NotificationsList"
import { SettingsAction } from "@/components/layout/SettingsAction/SettingsAction"
import { useSessionGate } from "@/providers/SessionGateProvider"

export default function NotificationsScreen() {
  const { gate } = useSessionGate()

  return (
    <ScreenShell
      title="Alerts"
      subtitle={gate.selectedVendorName}
      action={<SettingsAction />}
    >
      <NotificationsList />
    </ScreenShell>
  )
}
