import { useCallback, useState } from "react"

import { useBottomInset } from "@/hooks/useBottomInset"

// The web records `rejection_reason` and lets it be blank. Mobile requires a
// short one: a rejection with no reason becomes a support ticket later, and the
// booker sees this text.
//
// Flagging uses a HIGHER floor, passed in by the caller: `raise_booking_dispute`
// rejects anything under 10 characters server-side, and validating here means the
// vendor gets a sentence instead of a raw Postgres exception.
const MIN_REASON_LENGTH = 4

export function useRejectReasonSheet(
  onConfirm: (reason: string) => Promise<void> | void,
  onClose: () => void,
  minLength: number = MIN_REASON_LENGTH,
) {
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // `tabBar: false` — a Modal covers the tab bar, so only the system inset
  // applies. The sheet had NO bottom inset at all, which put Cancel and Confirm
  // under Android's navigation bar (plan B1).
  const bottomInset = useBottomInset({ tabBar: false })

  const trimmed = reason.trim()
  const canSubmit = trimmed.length >= minLength && !submitting

  const confirm = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onConfirm(trimmed)
      setReason("")
      onClose()
    } finally {
      setSubmitting(false)
    }
  }, [canSubmit, onConfirm, onClose, trimmed])

  const cancel = useCallback(() => {
    setReason("")
    onClose()
  }, [onClose])

  return { reason, setReason, canSubmit, submitting, confirm, cancel, bottomInset }
}
