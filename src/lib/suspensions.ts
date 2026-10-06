// Pure helpers (no DB): who is suspended right now.
// A sanction from matchday M of a tournament with N fechas means the player
// can't play matchdays M+1 … M+N of that tournament (expires_after_match = M+N).

import type { Match } from "@/lib/types"

export interface SanctionLike {
  playerId: string
  matchId: string | null
  matchesSuspended: number
  expiresAfterMatch: number | null
  /** Tournament and matchday of the match the sanction comes from */
  tournamentId: string | null
  matchday: number | null
}

export interface ActiveSuspension {
  tournamentId: string
  /** Last matchday the player misses */
  untilMatchday: number
}

/** Next matchday still to be played in each tournament (see getNextMatchdays for the DB version). */
export function nextMatchdays(matches: Match[]): Map<string, number> {
  const next = new Map<string, number>()
  for (const m of matches) {
    if (m.status !== "scheduled" && m.status !== "ongoing" && m.status !== "postponed") continue
    const current = next.get(m.tournamentId)
    if (current === undefined || m.matchday < current) next.set(m.tournamentId, m.matchday)
  }
  return next
}

/** Tournaments the sanctions come from (to ask for their next matchday). */
export function sanctionTournamentIds(sanctions: SanctionLike[]): string[] {
  return [...new Set(sanctions.flatMap((s) => (s.tournamentId && s.matchesSuspended > 0 ? [s.tournamentId] : [])))]
}

/** playerId → suspension that applies to the next matchday of its tournament. */
export function activeSuspensions(
  sanctions: SanctionLike[],
  next: Map<string, number>
): Map<string, ActiveSuspension> {
  const active = new Map<string, ActiveSuspension>()

  for (const s of sanctions) {
    if (!s.matchId || s.matchesSuspended <= 0 || !s.tournamentId || s.matchday == null) continue
    const until = s.expiresAfterMatch ?? s.matchday + s.matchesSuspended
    const upcoming = next.get(s.tournamentId)
    if (upcoming === undefined || upcoming > until) continue

    const existing = active.get(s.playerId)
    if (!existing || until > existing.untilMatchday) {
      active.set(s.playerId, { tournamentId: s.tournamentId, untilMatchday: until })
    }
  }
  return active
}
