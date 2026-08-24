import Constants from "expo-constants"
import { useMemo } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"

import { ScreenTitle } from "@/components/common/ScreenTitle/ScreenTitle"
import type { PushState } from "@/hooks/usePushRegistration"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./SettingsList.styles"
import { THEME_OPTIONS, useSettingsList } from "./useSettingsList"

const PUSH_LABELS: Record<PushState, string> = {
  checking: "Checking…",
  // Covers Expo Go and simulators alike — both need a development build.
  unsupported: "Needs a development build",
  undetermined: "Off",
  denied: "Blocked in device settings",
  granted: "On",
  unavailable: "Not ready yet",
}

// The running app's version, resolved once at module load — it cannot change
// while the app is running, so it is a constant rather than state and needs no
// hook.
//
// This IS the `package.json` version: `app.config.js` sets `expo.version` from
// `package.json`, and `expo.version` is what `Constants.expoConfig` exposes. Read
// through Constants rather than importing `package.json` directly, so the number
// shown here is guaranteed to be the one the OS and the stores report — importing
// the file would display a version the installed binary might not agree with.
//
// The fallback covers `expoConfig` being null, which happens in bare/edge runtime
// cases. A dash is better than "undefined" in a support conversation.
const APP_VERSION = Constants.expoConfig?.version ?? "—"

export function SettingsList() {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useSettingsList()

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: s.bottomInset }]}
    >
      {/* Scrolls with the content (B1). Settings passes no header action, so
          there is no pinned row above this — the title is the first thing on the
          screen and simply scrolls away like everything else. */}
      <ScreenTitle />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.segmented} accessibilityRole="radiogroup">
          {THEME_OPTIONS.map((option) => {
            const active = s.preference === option.value
            return (
              <Pressable
                key={option.value}
                onPress={() => s.setPreference(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    active && styles.segmentLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Push notifications</Text>
            <Text style={styles.rowValue}>{PUSH_LABELS[s.pushState]}</Text>
          </View>
          {s.pushState === "undetermined" ? (
            <Pressable
              onPress={s.enablePush}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.row,
                styles.rowDivider,
                pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.rowLabel}>Turn on notifications</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vendor</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Current</Text>
            <Text style={styles.rowValue}>{s.vendorName ?? "—"}</Text>
          </View>
          {s.canSwitchVendor ? (
            <Pressable
              onPress={s.switchVendor}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.row,
                styles.rowDivider,
                pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.rowLabel}>Switch vendor</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          {s.hasPortal ? (
            <Pressable
              onPress={s.openPortal}
              accessibilityRole="link"
              accessibilityHint="Opens the vendor web portal in a browser"
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Text style={styles.rowLabel}>Open the web portal</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={s.handleSignOut}
            disabled={s.signingOut}
            accessibilityRole="button"
            accessibilityState={{ busy: s.signingOut }}
            style={({ pressed }) => [
              styles.row,
              s.hasPortal && styles.rowDivider,
              pressed && styles.rowPressed,
            ]}
          >
            <Text style={styles.rowLabel}>
              {s.signingOut ? "Signing out…" : "Sign out"}
            </Text>
          </Pressable>
          {/* Privacy policy and account deletion are UNGATED (B2/B3).
              Both stores require these to accept a submission at all, and both used to be
              hidden whenever EXPO_PUBLIC_VENDOR_PORTAL_URL was unset — meaning a
              production build could ship without either. They are plain constants now. */}
          <Pressable
            onPress={s.openPrivacyPolicy}
            accessibilityRole="link"
            accessibilityHint="Opens Ezzy's privacy policy in a browser"
            style={({ pressed }) => [
              styles.row,
              styles.rowDivider,
              pressed && styles.rowPressed,
            ]}
          >
            <Text style={styles.rowLabel}>Privacy policy</Text>
          </Pressable>
          <Pressable
            onPress={s.openAccountDeletion}
            accessibilityRole="link"
            accessibilityHint="Opens Ezzy's account and data deletion page in a browser"
            style={({ pressed }) => [
              styles.row,
              styles.rowDivider,
              pressed && styles.rowPressed,
            ]}
          >
            <Text style={[styles.rowLabel, styles.danger]}>
              Delete account
            </Text>
          </Pressable>
        </View>
        <Text style={styles.footnote}>
          {/* Was "…handled on the web portal", which stopped being true the moment
              deletion moved to ezzy.ph. Registration and verification still are. */}
          Registration and document verification are handled on the web portal.
          Account deletion is explained on ezzy.ph.
        </Text>
      </View>

      {/* Reuses the label/value row from the Vendor section — a non-interactive
          pair with no press handler. No new styles: this is the same shape of
          information, so it should not look like a different kind of thing. */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>{APP_VERSION}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
