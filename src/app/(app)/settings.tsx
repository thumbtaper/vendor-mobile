import { ScreenShell } from "@/components/common/ScreenShell/ScreenShell"
import { SettingsList } from "@/components/settings/SettingsList/SettingsList"

export default function SettingsScreen() {
  return (
    <ScreenShell title="Settings">
      <SettingsList />
    </ScreenShell>
  )
}
