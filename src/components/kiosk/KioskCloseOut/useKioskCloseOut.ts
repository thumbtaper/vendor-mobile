import { useCallback, useMemo, useState } from "react"
import { closeOutDoneMessage, closeOutItem, normaliseCloseOutIdentifier, parseCloseOutBookings, type CloseOutBooking } from "@/lib/kioskCloseOut"
import { confirmKioskCloseOut, findKioskCloseOut, KioskApiError } from "@/services/kioskApi"
import { useAppTheme } from "@/theme/useAppTheme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { spacing } from "@/theme/tokens"
import { makeStyles } from "./KioskCloseOut.styles"

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof KioskApiError ? error.message : error instanceof Error ? error.message : fallback
}

export function useKioskCloseOut(vendorId: string, onHome: () => void) {
  const { tokens } = useAppTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const [identifier, setIdentifier] = useState("")
  const [matches, setMatches] = useState<CloseOutBooking[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const search = useCallback(async () => {
    const value = normaliseCloseOutIdentifier(identifier)
    if (value.length < 4 || searching || confirmingId) return
    setSearching(true)
    setSearched(false)
    setError(null)
    setDoneMessage(null)
    setMatches([])
    try {
      const response = await findKioskCloseOut(vendorId, value)
      setMatches(parseCloseOutBookings(response))
      setSearched(true)
    } catch (failure) {
      setSearched(true)
      setError(errorMessage(failure, "Could not look that up. Please try again or see staff."))
    } finally {
      setSearching(false)
    }
  }, [confirmingId, identifier, searching, vendorId])

  const confirm = useCallback(async (bookingId: string) => {
    if (confirmingId || searching) return
    setConfirmingId(bookingId)
    setError(null)
    setDoneMessage(null)
    try {
      const response = await confirmKioskCloseOut(vendorId, bookingId)
      setMatches([])
      setIdentifier("")
      setSearched(false)
      setDoneMessage(closeOutDoneMessage(response.status))
    } catch (failure) {
      setError(errorMessage(failure, "Could not update that booking. Please see staff."))
    } finally {
      setConfirmingId(null)
    }
  }, [confirmingId, searching, vendorId])

  return {
    tokens,
    styles,
    identifier,
    setIdentifier,
    matches,
    items: matches.map(closeOutItem),
    searching,
    searched,
    error,
    doneMessage,
    confirmingId,
    search,
    confirm,
    actionBarPaddingBottom: Math.max(spacing.md, insets.bottom),
    home: onHome,
  }
}
