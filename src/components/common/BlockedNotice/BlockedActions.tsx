import * as WebBrowser from "expo-web-browser"
import { useCallback, useState } from "react"

import { PrimaryButton } from "@/components/common/PrimaryButton/PrimaryButton"
import { WEB_PORTAL_URL } from "@/lib/constants"
import { signOut } from "@/services/auth.service"

// Split from BlockedNotice so that component stays pure display. This one owns
// handlers and in-flight state, so it carries them itself rather than adding a
// hook file for two callbacks.
export function BlockedActions() {
  const [signingOut, setSigningOut] = useState(false)

  const openPortal = useCallback(() => {
    if (WEB_PORTAL_URL) WebBrowser.openBrowserAsync(WEB_PORTAL_URL)
  }, [])

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    await signOut()
    // No navigation: the session change flips the route guards, which is the
    // single path that decides where the user lands.
    setSigningOut(false)
  }, [])

  return (
    <>
      {WEB_PORTAL_URL ? (
        <PrimaryButton label="Open the web portal" onPress={openPortal} />
      ) : null}
      <PrimaryButton
        label="Sign out"
        onPress={handleSignOut}
        loading={signingOut}
        variant="secondary"
      />
    </>
  )
}
