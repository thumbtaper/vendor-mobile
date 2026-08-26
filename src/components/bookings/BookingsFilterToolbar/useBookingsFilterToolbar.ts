import { useCallback, useMemo, useState } from "react"

import type { FilterOption } from "@/components/common/FilterOptionSheet/FilterOptionSheet"
import type { FilterCounts } from "@/hooks/useBookingFilterCounts"
import type { BookingFilter } from "@/hooks/useBookingsQuery"
import { BOOKING_FILTERS } from "@/lib/bookingFilters"
import {
  PERIOD_PRESETS,
  presetForWindow,
  rangeLabel,
  windowFor,
} from "@/lib/dateWindows"
import { phToday } from "@/lib/format"
import type { DateWindow } from "@/lib/types"

type ActiveSheet = "status" | "dates" | null

export interface UseBookingsFilterToolbarInput {
  filter: BookingFilter
  onFilterChange: (next: BookingFilter) => void
  window: DateWindow | null
  onWindowChange: (next: DateWindow | null) => void
  counts?: FilterCounts
}

export function useBookingsFilterToolbar({
  filter,
  onFilterChange,
  window,
  onWindowChange,
  counts,
}: UseBookingsFilterToolbarInput) {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)

  const closeSheet = useCallback(() => setActiveSheet(null), [])
  const openStatus = useCallback(() => setActiveSheet("status"), [])
  const openDates = useCallback(() => setActiveSheet("dates"), [])

  const today = phToday()
  const activePreset = window ? presetForWindow(window, today) : null
  const activeFilter = BOOKING_FILTERS.find((item) => item.key === filter)

  const statusLabel = activeFilter?.label ?? "Bookings"
  const statusBadge = counts?.[filter]
  const dateLabel =
    window === null
      ? "All dates"
      : PERIOD_PRESETS.find((preset) => preset.value === activePreset)?.label ??
        rangeLabel(window, today)

  const selectStatus = useCallback(
    (next: BookingFilter) => {
      onFilterChange(next)
      closeSheet()
    },
    [closeSheet, onFilterChange],
  )

  const selectWindow = useCallback(
    (next: DateWindow | null) => {
      onWindowChange(next)
      closeSheet()
    },
    [closeSheet, onWindowChange],
  )

  const statusOptions = useMemo<FilterOption[]>(
    () =>
      BOOKING_FILTERS.map((item) => ({
        key: item.key,
        label: item.label,
        meta: metaForFilter(item.key),
        badge: counts?.[item.key],
        selected: item.key === filter,
        onSelect: () => selectStatus(item.key),
      })),
    [counts, filter, selectStatus],
  )

  const dateOptions = useMemo<FilterOption[]>(
    () => [
      {
        key: "all-dates",
        label: "All dates",
        meta: "No date filter",
        selected: window === null,
        onSelect: () => selectWindow(null),
      },
      ...PERIOD_PRESETS.map((preset) => {
        const presetWindow = windowFor(preset.value, today)
        return {
          key: preset.value,
          label: preset.label,
          meta: rangeLabel(presetWindow, today),
          selected: preset.value === activePreset,
          onSelect: () => selectWindow(presetWindow),
        }
      }),
    ],
    [activePreset, selectWindow, today, window],
  )

  return {
    activeSheet,
    closeSheet,
    openStatus,
    openDates,
    statusLabel,
    statusBadge,
    dateLabel,
    statusOptions,
    dateOptions,
  }
}

function metaForFilter(key: BookingFilter): string {
  switch (key) {
    case "all":
      return "Every booking"
    case "needs_you":
      return "Pending approvals and returns"
    case "active":
      return "Approved work not finished yet"
    case "done":
      return "Completed bookings"
    case "issues":
      return "Disputes and review holds"
    case "closed":
      return "Cancelled or refunded"
  }
}
