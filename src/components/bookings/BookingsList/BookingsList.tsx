import { BookingFilterTabs } from "@/components/bookings/BookingFilterTabs/BookingFilterTabs"
import { BookingListItem } from "@/components/bookings/BookingListItem/BookingListItem"
import { RefreshableList } from "@/components/common/RefreshableList/RefreshableList"
import { StaleBanner } from "@/components/common/StaleBanner/StaleBanner"
import type { Booking } from "@/lib/types"
import { useBookingsList } from "./useBookingsList"

export function BookingsList() {
  const s = useBookingsList()

  return (
    <>
      <BookingFilterTabs value={s.filter} onChange={s.setFilter} />
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
