import { Redirect } from "expo-router"
// The tab press opens a staff dialog; direct links must not start kiosk mode.
export default function KioskLaunchRoute() { return <Redirect href="/dashboard" /> }
