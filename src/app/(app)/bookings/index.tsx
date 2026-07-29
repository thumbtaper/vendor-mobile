import { BookingsList } from "@/components/bookings/BookingsList/BookingsList"
import { ScreenShell } from "@/components/common/ScreenShell/ScreenShell"
import { SettingsAction } from "@/components/layout/SettingsAction/SettingsAction"
import { useSessionGate } from "@/providers/SessionGateProvider"

export default function BookingsScreen() {
  const { gate } = useSessionGate()

  return (
    <ScreenShell
      title="Bookings"
      subtitle={gate.selectedVendorName}
      action={<SettingsAction />}
    >
      <BookingsList />
    </ScreenShell>
  )
}
