import { useMemo } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"

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

export function SettingsList() {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useSettingsList()

  return (
    <ScrollView contentContainerStyle={styles.content}>
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
          {s.hasPortal ? (
            <Pressable
              onPress={s.openAccountDeletion}
              accessibilityRole="link"
              accessibilityHint="Opens the web portal to request account deletion"
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
          ) : null}
        </View>
        <Text style={styles.footnote}>
          Registration, document verification and account deletion are handled on
          the web portal.
        </Text>
      </View>
    </ScrollView>
  )
}
