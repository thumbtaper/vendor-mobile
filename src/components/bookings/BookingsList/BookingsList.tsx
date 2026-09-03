import { BookingsFilterToolbar } from "@/components/bookings/BookingsFilterToolbar/BookingsFilterToolbar"
import { BookingListItem } from "@/components/bookings/BookingListItem/BookingListItem"
import { RefreshableList } from "@/components/common/RefreshableList/RefreshableList"
import { ScreenTitle } from "@/components/common/ScreenTitle/ScreenTitle"
import { StaleBanner } from "@/components/common/StaleBanner/StaleBanner"
import type { Booking } from "@/lib/types"
import { useBookingsList } from "./useBookingsList"

export function BookingsList() {
  const s = useBookingsList()

  // Written inline rather than memoised: React reconciles this by element type,
  // so the toolbar and its sheets survive a re-render. See the `header` prop's
  // doc comment for why an element and not a component.
  const header = (
    <>
      <ScreenTitle />
      <BookingsFilterToolbar
        filter={s.filter}
        onFilterChange={s.setFilter}
        window={s.window}
        onWindowChange={s.setWindow}
        counts={s.filterCounts}
      />
      <StaleBanner
        dataUpdatedAt={s.dataUpdatedAt}
        isError={s.isError}
        isFetching={s.isFetching}
      />
    </>
  )

  return (
    <>
      <RefreshableList<Booking>
        header={header}
        separateHeaderFromRows
        data={s.bookings}
        keyExtractor={(booking) => booking.id}
        renderItem={({ item }) => (
          <BookingListItem booking={item} onPress={s.openBooking} />
        )}
        // NOTE — the old `contentPaddingTop={spacing.sm}` override is gone with B1.
        // It existed because the filter controls sat OUTSIDE the list and already
        // separated it from the screen header, making the default 24 padding
        // against padding (`.plans/2026-07-31-vendor-mobile-filter-density.md` I0).
        // The toolbar is now inside the scroll content, so the container's top
        // padding is what gives the screen title room beneath the pinned action
        // row — the premise inverted, so the override went rather than carrying
        // over a value whose reason no longer holds.
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
