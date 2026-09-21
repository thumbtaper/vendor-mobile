export const SIGNATURE_WIDTH = 600
export const SIGNATURE_HEIGHT = 300
export const MAX_SIGNATURE_POINTS = 4096
export const SIGNATURE_INK = "#0f172a"
export const SIGNATURE_PAPER = "#ffffff"

export type SignaturePoint = { x: number; y: number }

export function signaturePoint(x: number, y: number, width: number, height: number): SignaturePoint | null {
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null
  return {
    x: Math.round(Math.max(0, Math.min(1, x / width)) * SIGNATURE_WIDTH),
    y: Math.round(Math.max(0, Math.min(1, y / height)) * SIGNATURE_HEIGHT),
  }
}

export function signaturePath(points: SignaturePoint[]): string {
  if (!points.length) return ""
  const [first, ...rest] = points
  return `M${first.x},${first.y} l0.01,0 ${rest.map(p => `L${p.x},${p.y}`).join(" ")}`
}

// Native SVG returns bare base64; Android may include line breaks. Never persist it.
export function normaliseSignaturePng(value: string): string | null {
  if (value.length > 720_000) return null
  const base64 = value.replace(/\s/g, "")
  if (base64.length < 44 || base64.length > 699_052 || base64.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || !base64.startsWith("iVBORw0KGgo")) return null
  try {
    const header = atob(base64.slice(0, 32))
    if (header.slice(12, 16) !== "IHDR") return null
    const uint32 = (offset: number) => [...header.slice(offset, offset + 4)].reduce((n, c) => n * 256 + c.charCodeAt(0), 0)
    const width = uint32(16), height = uint32(20)
    return width > 0 && height > 0 && width <= 2048 && height <= 2048 ? base64 : null
  } catch { return null }
}
