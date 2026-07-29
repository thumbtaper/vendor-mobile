import * as SecureStore from "expo-secure-store"

// Session storage backed by the OS keystore (iOS Keychain / Android Keystore) —
// decision D6-A. The session token authorises booking approvals and this app
// displays payout ledgers, so it does not sit in plaintext AsyncStorage.
//
// SecureStore values are capped at roughly 2 KB on iOS, and a Supabase session
// (two JWTs plus user metadata) regularly exceeds that. The adapter therefore
// splits the value across numbered chunk keys and stores a small manifest under
// the caller's key. Reads and removals reassemble from the manifest, so callers
// see a plain key/value store.

const CHUNK_SIZE = 1800 // headroom under the ~2 KB iOS limit
const MANIFEST_PREFIX = "__chunks__:"

// SecureStore keys must be alphanumeric plus ".", "-", "_" — Supabase's default
// key contains none of the disallowed characters, but a project ref could.
function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, "_")
}

function chunkKey(key: string, index: number): string {
  return `${safeKey(key)}.${index}`
}

async function clearChunks(key: string, count: number): Promise<void> {
  const deletions: Promise<void>[] = []
  for (let i = 0; i < count; i++) {
    deletions.push(SecureStore.deleteItemAsync(chunkKey(key, i)))
  }
  await Promise.all(deletions)
}

async function readChunkCount(key: string): Promise<number> {
  const manifest = await SecureStore.getItemAsync(safeKey(key))
  if (!manifest?.startsWith(MANIFEST_PREFIX)) return 0
  const count = Number.parseInt(manifest.slice(MANIFEST_PREFIX.length), 10)
  return Number.isFinite(count) && count > 0 ? count : 0
}

export const secureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    const manifest = await SecureStore.getItemAsync(safeKey(key))
    if (manifest === null) return null
    if (!manifest.startsWith(MANIFEST_PREFIX)) return manifest

    const count = Number.parseInt(manifest.slice(MANIFEST_PREFIX.length), 10)
    if (!Number.isFinite(count) || count <= 0) return null

    const parts = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.getItemAsync(chunkKey(key, i)),
      ),
    )
    // A partial write (process killed mid-save) must read as "no session"
    // rather than as a corrupt one — supabase-js then treats the user as
    // signed out instead of throwing on a truncated JWT.
    if (parts.some((p) => p === null)) return null
    return parts.join("")
  },

  async setItem(key: string, value: string): Promise<void> {
    // Always clear whatever was there — an earlier longer session leaves
    // orphaned chunks that a shorter one would not overwrite.
    await clearChunks(key, await readChunkCount(key))

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(safeKey(key), value)
      return
    }

    const chunks: string[] = []
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE))
    }
    // Chunks land before the manifest: if the process dies mid-write, the old
    // manifest is already gone and getItem returns null (signed out) rather
    // than pointing at an incomplete set.
    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk)),
    )
    await SecureStore.setItemAsync(
      safeKey(key),
      `${MANIFEST_PREFIX}${chunks.length}`,
    )
  },

  async removeItem(key: string): Promise<void> {
    await clearChunks(key, await readChunkCount(key))
    await SecureStore.deleteItemAsync(safeKey(key))
  },
}
