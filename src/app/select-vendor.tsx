import { AuthScreen } from "@/components/common/AuthScreen/AuthScreen"
import { VendorPicker } from "@/components/vendor/VendorPicker/VendorPicker"
import { useSessionGate } from "@/providers/SessionGateProvider"

export default function SelectVendorScreen() {
  const { gate } = useSessionGate()

  return (
    <AuthScreen>
      <VendorPicker vendors={gate.vendors} onSelect={gate.selectVendor} />
    </AuthScreen>
  )
}
