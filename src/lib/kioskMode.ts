export const KIOSK_STORAGE_KEY = "ezzy.vendor.kioskVendor"
export const KIOSK_IDLE_MS = 90_000

export type KioskMode =
  | { status: "restoring" | "storage_error"; vendorId: null }
  | { status: "inactive"; vendorId: null }
  | { status: "active"; vendorId: string }

export function kioskContainsStaff(mode: KioskMode): boolean {
  return mode.status !== "inactive"
}

export function isVendorUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

// Notification callbacks run outside React. Default closed until storage is read.
let staffNotificationsBlocked = true
export function areStaffNotificationsBlocked() { return staffNotificationsBlocked }

interface Storage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

/** Storage errors must not silently return a customer to staff navigation. */
export class KioskModeStore {
  private state: KioskMode = { status: "restoring", vendorId: null }
  private listeners = new Set<() => void>()
  private busy = false

  private storage: Storage
  constructor(storage: Storage) { this.storage = storage }
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  private publish(state: KioskMode) {
    this.state = state
    staffNotificationsBlocked = kioskContainsStaff(state)
    this.listeners.forEach(listener => listener())
  }
  restore = async () => {
    if (this.busy) return
    this.busy = true
    try {
      const value = await this.storage.getItem(KIOSK_STORAGE_KEY)
      if (value !== null && !isVendorUuid(value)) throw new Error("Invalid kiosk vendor")
      this.publish(value === null
        ? { status: "inactive", vendorId: null }
        : { status: "active", vendorId: value })
    } catch {
      this.publish({ status: "storage_error", vendorId: null })
    } finally { this.busy = false }
  }
  enter = async (vendorId: string) => {
    if (this.busy || this.state.status !== "inactive" || !isVendorUuid(vendorId)) {
      throw new Error("Kiosk cannot start right now.")
    }
    this.busy = true
    try {
      await this.storage.setItem(KIOSK_STORAGE_KEY, vendorId)
      this.publish({ status: "active", vendorId })
    } catch {
      this.publish({ status: "storage_error", vendorId: null })
      throw new Error("Could not save kiosk mode. Please retry.")
    } finally { this.busy = false }
  }
  /** Caller must complete staff re-authentication before invoking this. */
  leave = async () => {
    if (this.busy || this.state.status !== "active") throw new Error("Kiosk is not ready.")
    this.busy = true
    try {
      await this.storage.removeItem(KIOSK_STORAGE_KEY)
      this.publish({ status: "inactive", vendorId: null })
    } catch {
      throw new Error("Could not save the exit. Kiosk remains active; please retry.")
    } finally { this.busy = false }
  }
}
