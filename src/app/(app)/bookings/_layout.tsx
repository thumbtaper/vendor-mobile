import { Stack } from "expo-router"

// A stack inside the Bookings tab so the detail screen pushes over the list and
// Android's hardware back returns to it with the filter intact (plan §5.2).
export default function BookingsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
