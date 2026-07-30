import {
  CalendarCheck,
  CircleAlert,
  CircleCheckBig,
  TrendingUp,
} from "lucide-react-native"
import { useMemo } from "react"
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native"

import { BookingListItem } from "@/components/bookings/BookingListItem/BookingListItem"
import { StaleBanner } from "@/components/common/StaleBanner/StaleBanner"
import { StatCard } from "@/components/dashboard/StatCard/StatCard"
import { useRefreshableList } from "@/components/common/RefreshableList/useRefreshableList"
import { fmtPeso } from "@/lib/format"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./DashboardView.styles"
import { useDashboardView } from "./useDashboardView"

export function DashboardView() {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const s = useDashboardView()
  const { refreshing, refresh } = useRefreshableList(s.refresh)

  const stats = s.stats

  return (
    <>
      <StaleBanner
        dataUpdatedAt={s.dataUpdatedAt}
        isError={s.isError}
        isFetching={s.isFetching}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={tokens.text}
            colors={[tokens.strong]}
            progressBackgroundColor={tokens.cardBg}
          />
        }
      >
        {s.isError && !stats ? (
          <Text style={styles.errorText}>
            Couldn&apos;t load your stats. Pull down to try again.
          </Text>
        ) : null}

        {/* Glyphs and tints are the web dashboard's, card for card
            (`vendor/components/dashboard/DashboardPage`), so the two clients read
            the same at a glance. Canonical lucide v1 names — the web app is on
            0.468 and still spells these `AlertCircle` / `CheckCircle`. */}
        <View style={styles.grid}>
          <StatCard
            label="Pending Approvals"
            value={stats?.pendingApprovals ?? 0}
            sub="Waiting on you"
            loading={s.isLoading}
            icon={CircleAlert}
            iconColor="#f59e0b"
            iconBg="rgba(245,158,11,0.12)"
            urgent={(stats?.pendingApprovals ?? 0) > 0}
          />
          <StatCard
            label="Today's Bookings"
            value={stats?.todaysBookings ?? 0}
            sub="Manila time"
            loading={s.isLoading}
            icon={CalendarCheck}
            iconColor="#3b82f6"
            iconBg="rgba(59,130,246,0.12)"
          />
          <StatCard
            label="Completed This Month"
            value={stats?.completedThisMonth ?? 0}
            sub={stats?.monthLabel}
            loading={s.isLoading}
            icon={CircleCheckBig}
            iconColor="#10b981"
            iconBg="rgba(16,185,129,0.12)"
          />
          <StatCard
            label="Monthly Revenue"
            value={fmtPeso(stats?.monthlyRevenue ?? 0, 0)}
            sub={
              stats?.revenueAvailable === false
                ? "Payment ledger unavailable"
                : stats?.monthLabel
            }
            loading={s.isLoading}
            unavailable={stats?.revenueAvailable === false}
            icon={TrendingUp}
            iconColor="#6366f1"
            iconBg="rgba(99,102,241,0.12)"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Waiting for approval</Text>
          <Pressable
            onPress={s.openAllBookings}
            accessibilityRole="link"
            style={styles.link}
          >
            <Text style={styles.linkLabel}>See all</Text>
          </Pressable>
        </View>

        {s.pendingPreview.length === 0 && !s.pendingLoading ? (
          <Text style={styles.emptyText}>
            Nothing needs your approval right now.
          </Text>
        ) : (
          <View style={styles.previewList}>
            {s.pendingPreview.map((booking) => (
              <BookingListItem
                key={booking.id}
                booking={booking}
                onPress={s.openBooking}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  )
}
