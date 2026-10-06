import type { Match, Team } from "@/lib/types"

export interface Standing {
  teamId: string
  teamName: string
  teamShortName: string
  shield: string
  /** Left the tournament (its pending matches were given as W.O.) */
  withdrawn: boolean
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

/**
 * Calculate standings from a list of matches and the teams that compete.
 * Every team passed in gets a row (0 played if it hasn't played yet), plus any
 * other team that appears in a finished match.
 * Pure function — no DB calls, usable by both admin and public pages.
 */
export function calculateStandings(
  matches: Match[],
  teams: Team[],
  withdrawnTeamIds: ReadonlySet<string> = new Set()
): Standing[] {
  const finishedMatches = matches.filter((m) => m.status === "finished")

  const teamMap = new Map(teams.map((t) => [t.id, t]))
  const standingsMap = new Map<string, Standing>()

  const teamIds = new Set<string>(teams.map((t) => t.id))
  finishedMatches.forEach((m) => {
    teamIds.add(m.homeTeamId)
    teamIds.add(m.awayTeamId)
  })

  teamIds.forEach((teamId) => {
    const team = teamMap.get(teamId)
    standingsMap.set(teamId, {
      teamId,
      teamName: team?.name ?? "Desconocido",
      teamShortName: team?.shortName ?? team?.name ?? "Desconocido",
      shield: team?.shield ?? "/placeholder.svg",
      withdrawn: withdrawnTeamIds.has(teamId),
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    })
  })

  // Process each match
  finishedMatches.forEach((match) => {
    const home = standingsMap.get(match.homeTeamId)
    const away = standingsMap.get(match.awayTeamId)
    if (!home || !away) return
    if (match.homeScore == null || match.awayScore == null) return

    home.played++
    away.played++
    home.goalsFor += match.homeScore
    home.goalsAgainst += match.awayScore
    away.goalsFor += match.awayScore
    away.goalsAgainst += match.homeScore

    if (match.homeScore > match.awayScore) {
      home.won++
      home.points += 3
      away.lost++
    } else if (match.homeScore < match.awayScore) {
      away.won++
      away.points += 3
      home.lost++
    } else {
      home.drawn++
      away.drawn++
      home.points += 1
      away.points += 1
    }
  })

  // Calculate goal differences
  const standings = Array.from(standingsMap.values())
  standings.forEach((s) => {
    s.goalDifference = s.goalsFor - s.goalsAgainst
  })

  // Sort: points > goal difference > goals for > name
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return a.teamName.localeCompare(b.teamName)
  })

  return standings
}
