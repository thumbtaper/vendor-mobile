import { Eraser } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"
import Svg, { Path, Rect } from "react-native-svg"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { SIGNATURE_INK, SIGNATURE_PAPER } from "@/lib/kioskSignature"
import { useKioskSignature } from "./useKioskSignature"

export function KioskSignature({ signerName, onConfirm }: { signerName: string; onConfirm: (png: string) => void }) {
  const { styles, tokens, paths, saving, error, clear, save, disabled, handlers, setSvg, layout, help } = useKioskSignature(onConfirm)
  return <View style={styles.content}>
    <Text style={styles.heading} accessibilityRole="header">Your signature</Text>
    <View style={styles.pad} onLayout={layout} {...handlers} accessible accessibilityLabel="Signature drawing area" accessibilityHint="For assistance, use the Signature assistance button below.">
      <Svg ref={setSvg} width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="none" pointerEvents="none">
        <Rect width="600" height="300" fill={SIGNATURE_PAPER} />
        {paths.map((d, i) => <Path key={i} d={d} fill="none" stroke={SIGNATURE_INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />)}
      </Svg>
    </View>
    <View style={styles.toolbar}>
      <Text style={styles.signer}>{signerName}</Text>
      <Pressable style={styles.clear} onPress={clear} accessibilityRole="button" accessibilityLabel="Clear signature">
        <Eraser size={22} color={tokens.strong} />
      </Pressable>
    </View>
    {error ? <Text style={styles.text} accessibilityRole="alert">{error}</Text> : null}
    <PrimaryButton label="Use signature" onPress={save} disabled={disabled} loading={saving} />
    <PrimaryButton label="Signature assistance" variant="secondary" onPress={help} />
  </View>
}
