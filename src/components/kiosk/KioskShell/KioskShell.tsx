import { StatusBar } from "expo-status-bar"
import { LockKeyhole } from "lucide-react-native"
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { KioskStaffDialog } from "../KioskStaffDialog/KioskStaffDialog"
import { KioskCatalogue } from "../KioskCatalogue/KioskCatalogue"
import { useKioskShell } from "./useKioskShell"

export function KioskShell() {
  const s = useKioskShell()
  return (
    <SafeAreaView style={s.styles.root} onTouchStart={s.touch}>
      <StatusBar style={s.isDark ? "light" : "dark"} />
      <KeyboardAvoidingView style={s.styles.keyboard} behavior={Platform.OS === "android" ? "height" : undefined}>
      <ScrollView contentContainerStyle={s.styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}>
        <View style={s.styles.header}>
          {s.mode.status === "active" ? <Pressable onPress={s.openExit} style={s.styles.staff} accessibilityRole="button" accessibilityLabel="Staff exit">
            <LockKeyhole size={20} color={s.tokens.text} />
            <Text style={s.styles.text}>Staff</Text>
          </Pressable> : null}
        </View>
        <View style={s.styles.body} key={s.resetKey}>
          <Image source={require("@/assets/brand/mark-white.png")} style={s.styles.brand} resizeMode="contain" accessible={false} />
          {s.mountCatalogue && s.mode.vendorId ? <View style={(!s.ready || s.browserOpen) && s.styles.hidden}>
            <KioskCatalogue vendorId={s.mode.vendorId} onHome={s.home} review={s.review} />
          </View> : null}
          {s.browserOpen ? <Text style={s.styles.text}>Document review in progress</Text> : s.ready ? !s.browsing ? <>
            <Text style={s.styles.title} accessibilityRole="header">{s.vendorName}</Text>
            <Text style={s.styles.title}>Welcome</Text>
            <PrimaryButton label="Book something" onPress={s.openCatalogue} />
            <PrimaryButton label="Finish a booking" onPress={s.openSignIn} variant="secondary" disabled />
            <Text style={s.styles.text}>Bookings are not available yet. Please see staff.</Text>
          </> : null : s.checking ? <ActivityIndicator accessibilityLabel="Checking kiosk access" /> : <>
            <Text style={s.styles.title} accessibilityRole="header">Kiosk unavailable</Text>
            <Text style={s.styles.text} accessibilityRole="alert">{s.mode.status === "storage_error" ? "Could not restore kiosk settings. Please retry." : s.message ?? "Please see staff."}</Text>
            <PrimaryButton label="Retry" onPress={s.retry} />
            {s.mode.status === "active" ? <PrimaryButton label="Staff sign-in" variant="secondary" onPress={s.openSignIn} /> : null}
          </>}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      {s.active && s.staffDialog ? <KioskStaffDialog key={s.staffIdentity} exit={s.staffDialog === "exit"} onClose={s.closeStaff} /> : null}
    </SafeAreaView>
  )
}
