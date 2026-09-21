import * as WebBrowser from "expo-web-browser"
import { AppState } from "react-native"
import { KIOSK_REVIEW_MAX_MS } from "@/lib/kioskCustomer"

/** Callers validate the URL. Android resolves 'opened' before the user returns. */
export async function openKioskBrowser(url: string): Promise<void> {
  let away = false
  let finish: () => void = () => {}
  const returned = new Promise<void>(resolve => { finish = resolve })
  const subscription = AppState.addEventListener("change", state => {
    if (state !== "active") away = true
    else if (away) finish()
  })
  let timeout: ReturnType<typeof setTimeout> | undefined
  const expired = new Promise<void>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Browser session timed out. Please see staff.")), KIOSK_REVIEW_MAX_MS + 1)
  })
  try {
    await Promise.race([
      (async () => {
        const result = await WebBrowser.openBrowserAsync(url, {
          dismissButtonStyle: "done", createTask: false, showInRecents: false,
        })
        if (result.type === "opened") await returned
      })(), expired,
    ])
  } finally { subscription.remove(); clearTimeout(timeout) }
}
