import { Tabs } from "expo-router"
import { Bell, CalendarCheck, LayoutDashboard, Wallet } from "lucide-react-native"

import { TabBarBackground } from "@/components/layout/TabBarBackground/TabBarBackground"
import { useUnreadCount } from "@/hooks/useNotificationsQuery"
import { useNotificationsRealtime } from "@/hooks/useNotificationsRealtime"
import { PushProvider } from "@/providers/PushProvider"
import { useSessionGate } from "@/providers/SessionGateProvider"
import { useAppTheme } from "@/theme/useAppTheme"

// Mirrors vendor web's own bottom `TabBar` information architecture
// (`vendor/components/layout/TabBar`). Settings is a header action rather than a
// fifth tab — it is not a destination the vendor visits while working.
export default function AppTabsLayout() {
  return (
    <PushProvider>
      <AppTabs />
    </PushProvider>
  )
}

function AppTabs() {
  const { tokens } = useAppTheme()
  const { session } = useSessionGate()
  const unread = useUnreadCount()

  // Mounted at the layout so the arrival toast and the badge work from whichever
  // tab the vendor is on, not only after Alerts has been opened.
  useNotificationsRealtime(session?.user.id ?? null)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: tokens.text,
        // Transparent so the blurred background shows through; the bar's own
        // colour comes from TabBarBackground.
        tabBarStyle: { position: "absolute", borderTopWidth: 0 },
        tabBarBackground: () => <TabBarBackground />,
        sceneStyle: { backgroundColor: "transparent" },
      }}
    >
      {/* Named `dashboard`, not `index`: an `(app)/index.tsx` would resolve to
          `/` and collide with the root anchor route that drives the guards. */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <CalendarCheck color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
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
      {/* Reachable from the header action, not from the tab bar. */}
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  )
}
