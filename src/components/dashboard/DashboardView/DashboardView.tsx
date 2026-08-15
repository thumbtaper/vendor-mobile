import {
  CalendarCheck,
  CircleAlert,
  CircleCheckBig,
  TrendingUp,
} from "lucide-react-native"
import { useMemo } from "react"
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native"

import { BookingListItem } from "@/components/bookings/BookingListItem/BookingListItem"
import { PeriodFilter } from "@/components/common/PeriodFilter/PeriodFilter"
import { ScreenTitle } from "@/components/common/ScreenTitle/ScreenTitle"
import { StaleBanner } from "@/components/common/StaleBanner/StaleBanner"
import { GuideCard } from "@/components/dashboard/GuideCard/GuideCard"
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: s.contentBottomPadding },
        ]}
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
        {/* Both inside the scroll content now (B1) — the title so it scrolls away
            with everything else, the banner because it annotates the data below it
            and pinning it would rebuild the fixed block this change removes. */}
        <ScreenTitle />
        {/* Above the banner and the numbers: it is the control that decides what
            both of them are about, so it reads top-down. Two of the four cards
            ignore it by design — Pending and Today's are live queues, not
            period figures. */}
        <PeriodFilter value={s.window} onChange={s.setWindow} />
        <StaleBanner
          dataUpdatedAt={s.dataUpdatedAt}
          isError={s.isError}
          isFetching={s.isFetching}
        />

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
            onPress={s.openPending}
            accessibilityHint="Opens the bookings that need you"
          />
          <StatCard
            label="Today's Bookings"
            value={stats?.todaysBookings ?? 0}
            sub="Manila time"
            loading={s.isLoading}
            icon={CalendarCheck}
            iconColor="#3b82f6"
            iconBg="rgba(59,130,246,0.12)"
            onPress={s.openToday}
            accessibilityHint="Opens today's bookings"
          />
          {/* "Completed", not "Completed This Month" (I1): with a control set to
              "Today" or "12 months", a card whose NAME states a period the number
              does not cover contradicts itself. The period lives in the sub-line,
              which is the one place it can follow the control. */}
          <StatCard
            label="Completed"
            value={stats?.completed ?? 0}
            sub={stats?.periodLabel}
            loading={s.isLoading}
            icon={CircleCheckBig}
            iconColor="#10b981"
            iconBg="rgba(16,185,129,0.12)"
            onPress={s.openCompleted}
            accessibilityHint="Opens completed bookings for this period"
          />
          <StatCard
            label="Revenue"
            value={fmtPeso(stats?.revenue ?? 0, 0)}
            sub={
              stats?.revenueAvailable === false
                ? "Payment ledger unavailable"
                : stats?.periodLabel
            }
            loading={s.isLoading}
            unavailable={stats?.revenueAvailable === false}
            icon={TrendingUp}
            iconColor="#6366f1"
            iconBg="rgba(99,102,241,0.12)"
            onPress={s.openRevenue}
            accessibilityHint="Opens transactions for this period"
          />
        </View>

        {/* Sits under the grid rather than inside the Revenue card: the card's
            `sub` line already carries the period, and a two-line warning inside a
            2×2 tile would either truncate or break the row heights. Only shown
            when the ledger IS readable — an unavailable card already says its own
            thing, and stacking both states reads as two separate faults.

            No row count in the copy — the transactions warning quotes none
            either, and a number here would either hardcode the ceiling or drag a
            service constant into the render layer to say something the vendor
            cannot act on. */}
        {stats?.revenueAvailable && !stats.revenueComplete ? (
          <Text style={styles.warning}>
            This period has more payments than can be totalled at once, so Revenue
            covers the most recent ones and the real figure is higher.
          </Text>
        ) : null}

        {/* Below the stats, not above them: the numbers are what a returning
            vendor opens the app for, and a guide they have read fifty times
            should not push them below the fold. A first-time vendor still
            reaches it with one short scroll. Owns its own shown/hidden state, so
            `useDashboardView` is untouched. */}
        <GuideCard />

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
