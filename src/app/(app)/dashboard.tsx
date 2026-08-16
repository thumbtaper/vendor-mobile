import { ScreenShell } from "@/components/common/ScreenShell/ScreenShell"
import { DashboardView } from "@/components/dashboard/DashboardView/DashboardView"
import { useGuideCard } from "@/components/dashboard/GuideCard/useGuideCard"
import { GuideAction } from "@/components/layout/GuideAction/GuideAction"
import { SettingsAction } from "@/components/layout/SettingsAction/SettingsAction"
import { useSessionGate } from "@/providers/SessionGateProvider"

export default function DashboardScreen() {
  const { gate } = useSessionGate()

  // The guide's state lives HERE, not in `GuideCard`, and the reason is
  // structural rather than stylistic: its trigger is now a header action rendered
  // through `ScreenShell`'s `action` slot, while the card renders inside
  // `DashboardView`. This route is the only common ancestor of the two. Left in
  // the card, a header tap would flip a second, independent copy of the state and
  // nothing on screen would move.
  const guide = useGuideCard()

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
          <GuideAction expanded={guide.hidden === false} onPress={guide.toggle} />
          <SettingsAction />
        </>
      }
    >
      <DashboardView guideHidden={guide.hidden} onHideGuide={guide.hide} />
    </ScreenShell>
  )
}
