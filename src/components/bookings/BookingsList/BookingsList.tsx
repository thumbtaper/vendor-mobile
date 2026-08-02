import { BookingFilterTabs } from "@/components/bookings/BookingFilterTabs/BookingFilterTabs"
import { BookingListItem } from "@/components/bookings/BookingListItem/BookingListItem"
import { RefreshableList } from "@/components/common/RefreshableList/RefreshableList"
import { StaleBanner } from "@/components/common/StaleBanner/StaleBanner"
import type { Booking } from "@/lib/types"
import { spacing } from "@/theme/tokens"
import { useBookingsList } from "./useBookingsList"

export function BookingsList() {
  const s = useBookingsList()

  return (
    <>
      <BookingFilterTabs
        value={s.filter}
        onChange={s.setFilter}
        counts={s.filterCounts}
      />
      <StaleBanner
        dataUpdatedAt={s.dataUpdatedAt}
        isError={s.isError}
        isFetching={s.isFetching}
      />
      <RefreshableList<Booking>
        data={s.bookings}
        keyExtractor={(booking) => booking.id}
        renderItem={({ item }) => (
          <BookingListItem booking={item} onPress={s.openBooking} />
        )}
        // The filter strip directly above already separates the header from the
        // list, so the default `spacing.xl` was padding against padding — 24pt
        // of the ~65pt between the header and the first card, and the largest
        // single contributor. See `.plans/2026-07-31-vendor-mobile-filter-density.md` I0.
        contentPaddingTop={spacing.sm}
        onRefresh={s.refresh}
        onEndReached={s.loadMore}
        onEndReachedThreshold={0.5}
        loading={s.isLoading}
        loadingMore={s.isFetchingNextPage}
        error={s.errorMessage}
        onRetry={s.refresh}
        emptyTitle={s.empty.title}
        emptyBody={s.empty.body}
      />
    </>
  )
}
