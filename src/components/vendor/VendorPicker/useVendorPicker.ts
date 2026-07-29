import { useCallback, useState } from "react"

import type { DbVendor } from "@/services/vendor.service"

// Owns only the in-flight state of a selection. The selection itself (persistence,
// cache purge) belongs to `useVendorGate`, which the screen passes in — this hook
// depends on the function signature, not on the storage implementation.
export function useVendorPicker(onSelect: (id: string) => Promise<void>) {
  const [pendingId, setPendingId] = useState<string | null>(null)

  const select = useCallback(
    async (vendor: DbVendor) => {
      if (pendingId) return
      setPendingId(vendor.id)
      try {
        await onSelect(vendor.id)
      } finally {
        setPendingId(null)
      }
    },
    [onSelect, pendingId],
  )

  return { pendingId, select }
}
