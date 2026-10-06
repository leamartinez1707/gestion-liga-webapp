import type { PaginatedResult } from "@/lib/types"

/**
 * PostgREST answers PGRST103 when the requested page is past the last one (e.g.
 * the only row of the last page was just deleted). Instead of an error, show
 * the last page that exists.
 */
export async function lastPageIfOutOfRange<T>(
  error: { code?: string } | null,
  page: number,
  fetchPage: (page: number) => Promise<PaginatedResult<T>>
): Promise<PaginatedResult<T> | null> {
  if (error?.code !== "PGRST103" || page <= 1) return null
  const first = await fetchPage(1)
  return first.totalPages > 1 ? fetchPage(first.totalPages) : first
}
