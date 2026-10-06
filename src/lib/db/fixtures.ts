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
 * - Every pair meets exactly once (twice with doubleRound, swapping home/away)
 *
 * Pure function — no DB calls, safe for client components.
 */
export function generateRoundRobin(
  teamIds: string[],
  options: { doubleRound?: boolean } = {}
): FixtureMatch[] {
  const teams: (string | null)[] = [...teamIds]
  // Odd number of teams: one rests each round (null = "libre")
  if (teams.length % 2 !== 0) teams.push(null)

  const numTeams = teams.length
  const numRounds = numTeams - 1
  const half = numTeams / 2
  const fixtures: FixtureMatch[] = []

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < half; i++) {
      let home = teams[i]
      let away = teams[numTeams - 1 - i]
      // Alternate the fixed team's home/away so it isn't always local
      if (i === 0 && round % 2 === 1) [home, away] = [away, home]
      if (home && away) fixtures.push({ homeTeamId: home, awayTeamId: away, matchday: round + 1 })
    }
    // Circle method: keep the first team fixed, rotate the rest one position
    teams.splice(1, 0, teams.pop()!)
  }

  // Ida y vuelta: same rounds again with home and away swapped
  if (options.doubleRound) {
    const firstLeg = [...fixtures]
    for (const m of firstLeg) {
      fixtures.push({
        homeTeamId: m.awayTeamId,
        awayTeamId: m.homeTeamId,
        matchday: m.matchday + numRounds,
      })
    }
  }

  return fixtures
}
