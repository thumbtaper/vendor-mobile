import { useCallback, useMemo, useState } from "react"

import type { FilterOption } from "@/components/common/FilterOptionSheet/FilterOptionSheet"
import {
  PERIOD_PRESETS,
  presetForWindow,
  rangeLabel,
  windowFor,
} from "@/lib/dateWindows"
import { phToday } from "@/lib/format"
import type { DateWindow } from "@/lib/types"

export interface UseTransactionsFilterToolbarInput {
  window: DateWindow
  onWindowChange: (next: DateWindow | null) => void
}

export function useTransactionsFilterToolbar({
  window,
  onWindowChange,
}: UseTransactionsFilterToolbarInput) {
  const [open, setOpen] = useState(false)

  const closeSheet = useCallback(() => setOpen(false), [])
  const openSheet = useCallback(() => setOpen(true), [])

  const today = phToday()
  const activePreset = presetForWindow(window, today)
  const dateLabel =
    PERIOD_PRESETS.find((preset) => preset.value === activePreset)?.label ??
    rangeLabel(window, today)

  const selectWindow = useCallback(
    (next: DateWindow) => {
      onWindowChange(next)
      closeSheet()
    },
    [closeSheet, onWindowChange],
  )

  const dateOptions = useMemo<FilterOption[]>(
    () =>
      PERIOD_PRESETS.map((preset) => {
        const presetWindow = windowFor(preset.value, today)
        return {
          key: preset.value,
          label: preset.label,
          meta: rangeLabel(presetWindow, today),
          selected: preset.value === activePreset,
          onSelect: () => selectWindow(presetWindow),
        }
      }),
    [activePreset, selectWindow, today],
  )

  return {
    open,
    openSheet,
    closeSheet,
    dateLabel,
    dateOptions,
  }
}
