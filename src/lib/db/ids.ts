// Ids that go inside a PostgREST filter string (`.or("a.eq.<id>,…")`) must be
// checked first: a crafted value could add filters of its own.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value)
}

/** Only the valid uuids, without duplicates. */
export function uuids(values: Iterable<string | null | undefined>): string[] {
  return [...new Set([...values].filter(isUuid))]
}
