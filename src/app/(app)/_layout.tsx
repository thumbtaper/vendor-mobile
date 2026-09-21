import { Text } from "react-native"
import { KioskLauncher } from "@/components/kiosk/KioskLauncher/KioskLauncher"
import { useAppTabs } from "@/components/layout/AppTabs/useAppTabs"
import { styles } from "@/components/layout/AppTabs/AppTabs.styles"
import { Tabs } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { Bell, ClipboardList, House, Receipt, Tablet } from "lucide-react-native"

import { TabBarBackground } from "@/components/layout/TabBarBackground/TabBarBackground"
import { PushProvider } from "@/providers/PushProvider"

// Mirrors vendor web's own bottom `TabBar` information architecture
// (`vendor/components/layout/TabBar`). Settings is a header action rather than a
// fifth tab — it is not a destination the vendor visits while working.
//
// Glyphs match vendor's sidebar (`vendor/components/layout/Sidebar`, the complete
// nav map) section for section. Two of them are not free choices: `CalendarCheck`
// is vendor's *Calendar* icon and `Wallet` is its *Total Payout* metric icon, so
// using either here would collide with a meaning the web app has already assigned —
// and `Wallet` now appears on a card inside the Transactions tab itself.
// `House` is the canonical lucide v1 name for what vendor spells `Home`.
export default function AppTabsLayout() {
  return (
    <PushProvider>
      <AppTabs />
    </PushProvider>
  )
}

function AppTabs() {
  const s = useAppTabs()
  const { tokens, isDark, unread } = s

  return (
    <>
      {/* Driven by the app's own theme, not the OS scheme — a user who forces
          light while the device is dark (or the reverse) would otherwise get
          status-bar glyphs the same shade as the page behind them. */}
      <StatusBar style={isDark ? "light" : "dark"} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2563eb",
          tabBarInactiveTintColor: tokens.text,
          // Transparent so the blurred background shows through; the bar's own
          // colour comes from TabBarBackground.
          tabBarStyle: styles.tabBar,
          tabBarLabel: ({ children, color }) => <Text style={[styles.label, { color }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.3}>{children}</Text>,
          tabBarBackground: () => <TabBarBackground />,
          sceneStyle: styles.scene,
        }}
      >
        {/* Named `dashboard`, not `index`: an `(app)/index.tsx` would resolve to
            `/` and collide with the root anchor route that drives the guards. */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: "Bookings",
            tabBarIcon: ({ color, size }) => (
              <ClipboardList color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color, size }) => (
              <Receipt color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Alerts",
            tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
            // Capped so a long-unopened inbox can't widen the tab bar.
            tabBarBadge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined,
            tabBarAccessibilityLabel:
              unread > 0 ? `Alerts, ${unread} unread` : "Alerts",
          }}
        />
        <Tabs.Screen
          name="kiosk-launch"
          listeners={{ tabPress: s.openLauncher }}
          options={{
            title: "Kiosk Mode",
            href: s.launchEnabled ? undefined : null,
            tabBarAccessibilityLabel: "Kiosk Mode",
            tabBarIcon: ({ color, size }) => <Tablet color={color} size={size} />,
          }}
        />
        {/* Reachable from the header action, not from the tab bar. */}
        <Tabs.Screen name="settings" options={{ href: null }} />
      </Tabs>
      {s.launchEnabled && s.launchOpen && s.vendorId ? <KioskLauncher key={s.vendorId} vendorId={s.vendorId} onClose={s.closeLauncher} /> : null}
    </>
  )
}
