import {
  CalendarCheck,
  CircleAlert,
  CircleCheckBig,
  Percent,
  PiggyBank,
  Receipt,
  Wallet,
} from "lucide-react-native"
import { useMemo, useRef } from "react"
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native"

import { BookingListItem } from "@/components/bookings/BookingListItem/BookingListItem"
import { PeriodFilter } from "@/components/common/PeriodFilter/PeriodFilter"
import { ScreenTitle } from "@/components/common/ScreenTitle/ScreenTitle"
import { StaleBanner } from "@/components/common/StaleBanner/StaleBanner"
import { DashboardSection } from "@/components/dashboard/DashboardSection/DashboardSection"
import { GuideCard } from "@/components/dashboard/GuideCard/GuideCard"
import { StatCard } from "@/components/dashboard/StatCard/StatCard"
import { useRefreshableList } from "@/components/common/RefreshableList/useRefreshableList"
import { fmtPeso } from "@/lib/format"
import { useAppTheme } from "@/theme/useAppTheme"
import { makeStyles } from "./DashboardView.styles"
import { useDashboardView } from "./useDashboardView"

export function DashboardView({
  guideHidden,
  onHideGuide,
}: {
  /** Owned by the route — see `app/(app)/dashboard.tsx` for why it lives there. */
  guideHidden: boolean | null
  onHideGuide: () => void
}) {
  const { tokens } = useAppTheme()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  // An inert handle, not logic: the effect that scrolls it lives in the hook. It
  // is created here because `reactCompiler` rejects a ref handed back OUT of a
  // hook — see the note on `useDashboardView`.
  const scrollRef = useRef<ScrollView>(null)
  const s = useDashboardView(guideHidden, scrollRef)
  const { refreshing, refresh } = useRefreshableList(s.refresh)

  const stats = s.stats

  return (
    <>
      <ScrollView
        ref={scrollRef}
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
        <DashboardSection title="Operations" caption={s.opsCaption}>
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
          </View>
        </DashboardSection>

        {/* A second group, on a DIFFERENT clock — its caption says so, which is
            the only thing keeping one period control over both groups honest. */}
        <DashboardSection title="Earnings" caption={s.earningsCaption}>
          {/* Four figures that relate by two exact identities (see
              `services/financials.ts`):
                  gross = platformFee + net       net = payout + onHold
              so they read ACROSS as one decomposition rather than four unrelated
              numbers — which is why Platform Fee sits between Gross and Net.

              None of them repeats the period in its sub-line, unlike Completed
              above. All four follow the control uniformly, so the section caption
              carries the period once; Completed needs its own because its two
              neighbours deliberately ignore the period and it must say that it
              does not.

              All four share ONE destination: they count the same ledger over the
              same period, so four callbacks would be four ways to say one thing. */}
          <View style={styles.grid}>
            <StatCard
              label="Gross Income"
              value={fmtPeso(stats?.earnings?.gross ?? 0, 0)}
              sub="All payments, incl. held"
              loading={s.isLoading}
              unavailable={s.earningsUnavailable}
              icon={Receipt}
              iconColor="#3b82f6"
              iconBg="rgba(59,130,246,0.12)"
              onPress={s.openTransactions}
              accessibilityHint="Opens transactions for this period"
            />
            <StatCard
              label="Platform Fee"
              value={fmtPeso(stats?.earnings?.platformFee ?? 0, 0)}
              sub="Commission deducted"
              loading={s.isLoading}
              unavailable={s.earningsUnavailable}
              icon={Percent}
              iconColor="#f59e0b"
              iconBg="rgba(245,158,11,0.12)"
              onPress={s.openTransactions}
              accessibilityHint="Opens transactions for this period"
            />
            <StatCard
              label="Net Income"
              value={fmtPeso(stats?.earnings?.net ?? 0, 0)}
              sub="After platform fee"
              loading={s.isLoading}
              unavailable={s.earningsUnavailable}
              icon={PiggyBank}
              iconColor="#6366f1"
              iconBg="rgba(99,102,241,0.12)"
              onPress={s.openTransactions}
              accessibilityHint="Opens transactions for this period"
            />
            {/* The headline: what the vendor can actually be paid, and the ONE
                figure here that is unchanged from the old "Revenue" card — same
                rows, same column, asserted in `financials.test.ts`. Money still
                held is named rather than silently missing, because the gap
                between this and Net is the whole reason both cards exist. */}
            <StatCard
              label="Payout Released"
              value={fmtPeso(stats?.earnings?.payout ?? 0, 0)}
              sub={s.payoutSub}
              loading={s.isLoading}
              unavailable={s.earningsUnavailable}
              icon={Wallet}
              iconColor="#10b981"
              iconBg="rgba(16,185,129,0.12)"
              onPress={s.openTransactions}
              accessibilityHint="Opens transactions for this period"
            />
          </View>
        </DashboardSection>

        {/* The standalone truncation warning that used to sit here is GONE — it
            folded into the Earnings caption above (I2). Two places telling a
            vendor the same period is incomplete is worse than one, and the
            caption sits directly over the money it qualifies. */}

        {/* Below the stats, not above them: the numbers are what a returning
            vendor opens the app for, and a guide they have read fifty times
            should not push them below the fold. A first-time vendor still
            reaches it with one short scroll.

            It no longer owns its shown/hidden state — the header button toggles
            it, and this component is not that button's ancestor. `onLayout`
            reports where the card sits so revealing it can scroll it into view
            (I5); the wrapper exists for that measurement and nothing else. */}
        <View onLayout={(e) => s.onGuideLayout(e.nativeEvent.layout.y)}>
          <GuideCard hidden={guideHidden} onHide={onHideGuide} />
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
