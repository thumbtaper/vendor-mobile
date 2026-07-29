import { useCallback, useState } from "react"

// The web records `rejection_reason` and lets it be blank. Mobile requires a
// short one: a rejection with no reason becomes a support ticket later, and the
// booker sees this text.
const MIN_REASON_LENGTH = 4

export function useRejectReasonSheet(
  onConfirm: (reason: string) => Promise<void> | void,
  onClose: () => void,
) {
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const trimmed = reason.trim()
  const canSubmit = trimmed.length >= MIN_REASON_LENGTH && !submitting

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

  return { reason, setReason, canSubmit, submitting, confirm, cancel }
}
