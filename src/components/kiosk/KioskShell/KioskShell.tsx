import { LinearGradient } from "expo-linear-gradient"
import { StatusBar } from "expo-status-bar"
import { LockKeyhole } from "lucide-react-native"
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { KioskStaffDialog } from "../KioskStaffDialog/KioskStaffDialog"
import { KioskCatalogue } from "../KioskCatalogue/KioskCatalogue"
import { KioskCloseOut } from "../KioskCloseOut/KioskCloseOut"
import { useKioskShell } from "./useKioskShell"

export function KioskShell() {
  const s = useKioskShell()
  return (
    <LinearGradient
      colors={s.tokens.pageBg.colors}
      start={s.tokens.pageBg.start}
      end={s.tokens.pageBg.end}
      style={s.styles.gradient}
    >
    <SafeAreaView style={s.styles.root} onTouchStart={s.touch} onTouchMove={s.touch}>
      <StatusBar style={s.isDark ? "light" : "dark"} />
      <KeyboardAvoidingView style={s.styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={s.styles.screen}>
        <View style={s.styles.header}>
          <View style={s.styles.identity}>
            <LinearGradient
              colors={s.tokens.btnPrimary.colors}
              start={s.tokens.btnPrimary.start}
              end={s.tokens.btnPrimary.end}
              style={s.styles.brandMark}
            >
              <Image source={require("@/assets/brand/mark-white.png")} style={s.styles.brand} resizeMode="contain" accessible={false} />
            </LinearGradient>
            <View style={s.styles.identityCopy}>
              <Text style={s.styles.identityName}>{s.vendorName ?? "Ezzy Vendor"}</Text>
              <Text style={s.styles.identitySub}>Self-service booking</Text>
            </View>
            <View style={s.styles.kioskBadge}><Text style={s.styles.kioskBadgeText}>Kiosk</Text></View>
          </View>
          {s.mode.status === "active" ? <Pressable onPress={s.openExit} style={s.styles.staff} accessibilityRole="button" accessibilityLabel="Staff exit">
            <LockKeyhole size={20} color={s.tokens.text} />
            <Text style={s.styles.text}>Staff</Text>
          </Pressable> : null}
        </View>
        <View style={s.styles.body} key={s.resetKey}>
          {s.mountCatalogue && s.mode.vendorId ? <View style={[s.styles.catalogueHost, (!s.ready || s.browserOpen) && s.styles.hidden]}>
            <KioskCatalogue vendorId={s.mode.vendorId} onHome={s.home} review={s.review} payment={s.payment} />
          </View> : null}
          {s.browserOpen ? <Text style={s.styles.text}>Browser session in progress</Text> : s.ready ? s.browsing === "closeout" && s.mode.vendorId ? <KioskCloseOut vendorId={s.mode.vendorId} onHome={s.home} /> : !s.browsing ? <View style={s.styles.welcome}>
            <Text style={s.styles.title}>Welcome</Text>
            <Text style={s.styles.text}>What would you like to do?</Text>
            <PrimaryButton label="Book something" onPress={s.openCatalogue} size="large" />
            <PrimaryButton label="Finish a booking" onPress={s.openCloseOut} variant="secondary" size="large" />
          </View> : null : s.checking ? <ActivityIndicator accessibilityLabel="Checking kiosk access" /> : <View style={s.styles.welcome}>
            <Text style={s.styles.title} accessibilityRole="header">Kiosk unavailable</Text>
            <Text style={s.styles.text} accessibilityRole="alert">{s.mode.status === "storage_error" ? "Could not restore kiosk settings. Please retry." : s.message ?? "Please see staff."}</Text>
            <PrimaryButton label="Retry" onPress={s.retry} />
            {s.mode.status === "active" ? <PrimaryButton label="Staff sign-in" variant="secondary" onPress={s.openSignIn} /> : null}
          </View>}
        </View>
      </View>
      </KeyboardAvoidingView>
      {s.active && s.staffDialog ? <KioskStaffDialog key={s.staffIdentity} exit={s.staffDialog === "exit"} onClose={s.closeStaff} /> : null}
    </SafeAreaView>
    </LinearGradient>
  )
}
