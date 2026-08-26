import { ScreenShell } from "@/components/common/ScreenShell/ScreenShell"
import { DashboardView } from "@/components/dashboard/DashboardView/DashboardView"
import { GuideModal } from "@/components/dashboard/GuideModal/GuideModal"
import { useGuideModal } from "@/components/dashboard/GuideModal/useGuideModal"
import { GuideAction } from "@/components/layout/GuideAction/GuideAction"
import { SettingsAction } from "@/components/layout/SettingsAction/SettingsAction"
import { useSessionGate } from "@/providers/SessionGateProvider"

export default function DashboardScreen() {
  const { gate } = useSessionGate()

  // The guide's state lives HERE, not in the modal, because this route is the
  // common owner of the header button and the modal surface.
  const guide = useGuideModal()

  return (
    <ScreenShell
      title="Dashboard"
      subtitle={gate.selectedVendorName}
      // Guide first, then Settings — matching the vendor portal's header order
      // and putting the destructive-adjacent control furthest from the thumb's
      // resting arc. `ScreenShell`'s action row is already a `row` with a gap, so
      // two children need no layout change.
      action={
        <>
          <GuideAction open={guide.visible} onPress={guide.toggle} />
          <SettingsAction />
        </>
      }
    >
      <DashboardView />
      {guide.ready ? (
        <GuideModal
          visible={guide.visible}
          onClose={guide.close}
          topInset={guide.topInset}
          bottomInset={guide.bottomInset}
        />
      ) : null}
    </ScreenShell>
  )
}
