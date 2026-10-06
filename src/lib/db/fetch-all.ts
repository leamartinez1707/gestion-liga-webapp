// PostgREST returns at most `max_rows` rows per request (1000 on Supabase by
// default) and truncates silently. Reads that really need every row go through
// here, one page at a time.

/** Must not exceed the project's `max_rows` (API settings), or pages come back short and reading stops early. */
export const PAGE_SIZE = 1000

/**
 * Reads every row by calling `page(from, to)` until a page comes back short.
 * Build a fresh query in each call, ending in `.range(from, to)`, and order it
 * by a unique column (at least as a tiebreaker) so pages don't overlap.
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<{ data: T[]; error: string | null }> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) return { data: rows, error: error.message }
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return { data: rows, error: null }
  }
}

/** Ids per `.in()` filter: they travel in the URL, which has a size limit (~150 uuids ≈ 5.5 KB). */
export const IN_CHUNK = 150

/**
 * fetchAll for a filter on a list of ids: splits the list in chunks of
 * IN_CHUNK, reads them in parallel and joins the rows (order is per chunk).
 */
export async function fetchAllIn<T>(
  ids: string[],
  page: (ids: string[], from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<{ data: T[]; error: string | null }> {
  const unique = [...new Set(ids)]
  const parts: string[][] = []
  for (let i = 0; i < unique.length; i += IN_CHUNK) parts.push(unique.slice(i, i + IN_CHUNK))
  const results = await Promise.all(parts.map((part) => fetchAll<T>((from, to) => page(part, from, to))))
  return { data: results.flatMap((r) => r.data), error: results.find((r) => r.error)?.error ?? null }
}
