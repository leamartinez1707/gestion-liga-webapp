/**
 * Search text as an ilike pattern ("%texto%"): escapes the SQL wildcards and
 * drops the characters PostgREST uses inside or(). Null when there's nothing to search.
 */
export function likeTerm(q?: string | null): string | null {
  const text = (q ?? "")
    .trim()
    .replace(/[%_\\]/g, (c) => `\\${c}`)
    .replace(/[,()*:"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text ? `%${text}%` : null
}
