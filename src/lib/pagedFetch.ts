/*
 * Fetch every row of a query, one page at a time.
 *
 * PostgREST caps every response at `max_rows` (1000 in this project — see
 * backbone/supabase/config.toml) and signals it with HTTP 206, which supabase-js
 * does NOT surface as an error. Any unbounded select therefore returns silently
 * short data. Measured cost, not theory: a vendor with 1,253 transactions in
 * range had their payout understated by 19.7% with no error raised
 * (.plans/2026-08-10-vendor-dashboard-ux-enhancements.md, B1).
 *
 * Own module because it is unit-tested: `node --test` has no bundler and cannot
 * resolve the `@/` alias, so anything importing `@/lib/supabase/client` is
 * untestable. Same reason bookingCounts.ts and financials.ts live here. Keeping
 * the boundary arithmetic away from the Supabase client is the whole point —
 * this is the code where an off-by-one silently loses a page.
 *
 * Deliberately knows nothing about Supabase: callers pass a callback that fetches
 * one window and reports it in plain terms.
 */

/** One page of results, as the caller's fetcher reports it. */
export interface PageResult<T> {
  rows: T[] | null
  /** Total matching rows, ignoring the window. null when the caller didn't ask for a count. */
  total: number | null
  error: string | null
}

export interface PagedResult<T> {
  rows: T[]
  /** false when the rows are a subset — the ceiling was hit, or the server capped a page. */
  complete: boolean
  /**
   * Total matching rows as the server last reported it, or null if no count was
   * requested. Exposed because callers that show "n of m" already have it here —
   * re-querying for a number this loop was handed is pure waste.
   */
  total: number | null
  error: string | null
}

export interface PagedOptions {
  /** Rows per request. Must not exceed the server's max_rows, or every page comes back short. */
  pageSize?: number
  /** Hard ceiling on rows pulled into memory. Beyond it we report incompleteness rather than pretending. */
  maxRows?: number
}

const DEFAULT_PAGE_SIZE = 1000
const DEFAULT_MAX_ROWS  = 10_000

/**
 * `fetchPage(from, to)` is called with inclusive row offsets, matching
 * PostgREST's `.range()`.
 *
 * On error the whole call fails with no rows: a partial result presented as
 * though it were the answer is the defect this module exists to prevent.
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<PageResult<T>>,
  options: PagedOptions = {},
): Promise<PagedResult<T>> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const maxRows  = options.maxRows  ?? DEFAULT_MAX_ROWS

  const rows: T[] = []
  let total: number | null = null
  let sawShortPage = false

  for (let from = 0; from < maxRows; from += pageSize) {
    // The fetcher is wrapped because supabase-js does not reliably convert a
    // network-level failure (offline, aborted request, DNS) into `{ error }` — it
    // can reject instead. This module's contract is that it RETURNS an error, and
    // a caller that trusted that was left showing an empty list for a failed
    // fetch, which is the exact defect the error contract exists to prevent.
    let page: PageResult<T>
    try {
      page = await fetchPage(from, from + pageSize - 1)
    } catch (thrown) {
      return {
        rows: [], complete: false, total: null,
        error: thrown instanceof Error ? thrown.message : String(thrown),
      }
    }
    if (page.error) return { rows: [], complete: false, total: null, error: page.error }

    // Keep the latest count we were given. A count that shifts between requests
    // (rows inserted mid-read) must not be able to spin this loop, which is why
    // the short-page check below is an independent stop condition.
    if (page.total != null) total = page.total

    const batch = page.rows ?? []
    rows.push(...batch)

    if (batch.length < pageSize) { sawShortPage = true; break }
    if (total != null && rows.length >= total) break
  }

  return { rows, complete: isComplete(rows.length, total, sawShortPage), total, error: null }
}

/**
 * A short page is NOT by itself proof of completeness.
 *
 * If the server's own max_rows is below `pageSize`, every page comes back short
 * while rows remain — treating that as "reached the end" would reintroduce
 * exactly the silent truncation this module prevents. So when a count is
 * available it is authoritative, and the short page only decides the case where
 * the caller asked for no count at all.
 */
function isComplete(fetched: number, total: number | null, sawShortPage: boolean): boolean {
  return total != null ? fetched >= total : sawShortPage
}
