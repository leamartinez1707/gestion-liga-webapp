// Series/division scope shared by the public pages (server and client).
// Pure module: no DB access, safe to import from client components.

import type { Division, Registration, Series, Team, Tournament } from "@/lib/types"

export interface DivisionOption {
  id: string
  name: string
  slug: string
}

export interface SeriesOption {
  id: string
  name: string
  slug: string
  divisions: DivisionOption[]
}

export interface Scope {
  series: SeriesOption | null
  division: DivisionOption | null
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export function buildSeriesOptions(series: Series[], divisions: Division[]): SeriesOption[] {
  return series.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    divisions: divisions
      .filter((d) => d.seriesId === s.id)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((d) => ({ id: d.id, name: d.name, slug: slugify(d.name) })),
  }))
}

/**
 * Selected series/division from the URL (?serie=&div=). Falls back to the first
 * series and its first division: standings and scorers only make sense within
 * one division, so there is always one selected when the series has divisions.
 */
export function resolveScope(
  options: SeriesOption[],
  serieSlug?: string | null,
  divSlug?: string | null
): Scope {
  const series = options.find((s) => s.slug === serieSlug) ?? options[0] ?? null
  const division =
    series?.divisions.find((d) => d.slug === divSlug) ?? series?.divisions[0] ?? null
  return { series, division }
}

/** Teams entered (registered) in a tournament. */
export function teamsInTournament(
  teams: Team[],
  registrations: Registration[],
  tournamentId: string | undefined
): Team[] {
  if (!tournamentId) return []
  const ids = new Set(registrations.filter((r) => r.tournamentId === tournamentId).map((r) => r.teamId))
  return teams.filter((t) => ids.has(t.id))
}

/** Teams that left a tournament (shown with "Baja" in the standings). */
export function withdrawnInTournament(registrations: Registration[], tournamentId: string | undefined): Set<string> {
  return new Set(
    registrations.filter((r) => r.tournamentId === tournamentId && r.withdrawnAt).map((r) => r.teamId)
  )
}

/** Today in Argentina as YYYY-MM-DD (fixture dates are local). */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date())
}

/**
 * Tournaments of the selected division. The first one is the "current" one:
 * the newest that already started; tournaments that haven't started yet
 * (created ahead of time) go after, soonest first.
 */
export function tournamentsInScope(tournaments: Tournament[], scope: Scope, today = todayIso()): Tournament[] {
  const key = (t: Tournament) => t.startDate ?? t.season
  const upcoming = (t: Tournament) => !!t.startDate && t.startDate > today
  return tournaments
    .filter(
      (t) =>
        (!scope.series || t.seriesId === scope.series.id) &&
        (!scope.division || t.divisionId === scope.division.id)
    )
    .sort((a, b) => {
      if (upcoming(a) !== upcoming(b)) return upcoming(a) ? 1 : -1
      return upcoming(a) ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a))
    })
}

/** Query string that keeps the visitor's series/division when navigating. */
export function scopeQuery(scope: Scope, extra: Record<string, string> = {}): string {
  const sp = new URLSearchParams()
  if (scope.series) sp.set("serie", scope.series.slug)
  if (scope.division) sp.set("div", scope.division.slug)
  for (const [k, v] of Object.entries(extra)) if (v) sp.set(k, v)
  const qs = sp.toString()
  return qs ? `?${qs}` : ""
}

/** "Serie 1 · División A" for labels; "—" when not assigned. */
export function scopeLabel(options: SeriesOption[], seriesId?: string, divisionId?: string): string {
  const series = options.find((s) => s.id === seriesId)
  if (!series) return "—"
  const division = series.divisions.find((d) => d.id === divisionId)
  return division ? `${series.name} · ${division.name}` : series.name
}

/** "Apertura · Temporada 2026", without repeating the season when the name has it. */
export function tournamentLabel(t: { name: string; season: string }): string {
  return t.name.includes(t.season) ? t.name : `${t.name} · Temporada ${t.season}`
}
