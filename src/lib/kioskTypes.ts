import type { DurationUnit } from "./duration"
import type { FulfilmentPattern } from "./types"

// Read-only subset of vendor/lib/types.ts; no staff or customer records.
export interface Offering {
  id: string
  name: string
  code: string
  description: string
  price: number
  durationMinutes: number
  durationUnit: DurationUnit
  fulfilmentPattern: FulfilmentPattern
}

export interface Schedule {
  id: string
  offeringId: string
  offeringName: string
  category: string
  title: string
  date: string
  endDate: string | null
  time: string | null
  windowMinutes: number | null
  end: string | null
  days: number[]
  repeat: "none" | "weekly" | "biweekly" | "monthly"
  instId: string | null
  max: number
  durationMinutes: number
  durationUnit: DurationUnit
}

export interface OfferingAttachment {
  id: string
  offeringId: string
  kind: "photo" | "document"
  title: string
  storagePath: string | null
  body: string
  version: number
  requiresSignature: boolean
  sortOrder: number
  isActive: boolean
}
