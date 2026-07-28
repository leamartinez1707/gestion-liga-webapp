export interface FixtureMatch {
  homeTeamId: string
  awayTeamId: string
  matchday: number
}

/**
 * Generate a round-robin fixture using the Circle Method algorithm.
 * - Even number of teams: n-1 rounds, n/2 matches per round
 * - Odd number: n rounds, (n-1)/2 matches per round + one team rests ("bye")
 * - Team 1 is fixed, others rotate clockwise
 *
 * Pure function — no DB calls, safe for client components.
 */
export function generateRoundRobin(teamIds: string[]): FixtureMatch[] {
  const teams = [...teamIds]
  const fixtures: FixtureMatch[] = []

  // If odd number of teams, add a "bye" placeholder
  if (teams.length % 2 !== 0) {
    teams.push("BYE")
  }

  const numTeams = teams.length
  const numRounds = numTeams - 1
  const half = numTeams / 2

  // Fix first team, rotate others
  const fixed = teams[0]
  const rotating = teams.slice(1)

  for (let round = 0; round < numRounds; round++) {
    const roundMatches: { home: string; away: string }[] = []

    // First match: fixed vs last in rotating
    roundMatches.push({
      home: fixed,
      away: rotating[rotating.length - 1],
    })

    // Rest of the matches: pair up
    for (let i = 0; i < half - 1; i++) {
      roundMatches.push({
        home: rotating[i],
        away: rotating[rotating.length - 2 - i],
      })
    }

    // Filter out BYE matches and add to fixtures
    roundMatches.forEach((m) => {
      if (m.home !== "BYE" && m.away !== "BYE") {
        fixtures.push({
          homeTeamId: m.home,
          awayTeamId: m.away,
          matchday: round + 1,
        })
      }
    })

    // Rotate: keep first element, move last element to second position
    const last = rotating.pop()!
    rotating.splice(1, 0, last)
  }

  return fixtures
}
