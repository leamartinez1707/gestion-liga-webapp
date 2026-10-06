import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import type { Player } from "@/lib/types"
import { requireMatchEditor } from "@/lib/auth"
import { getMatch, getNextMatchdays } from "@/lib/db/matches"
import { getTeam } from "@/lib/db/teams"
import { getPlayersByTeam } from "@/lib/db/players"
import { getRegistrations, getRosters } from "@/lib/db/registrations"
import { getMatchEvents } from "@/lib/db/match-events"
import { getSanctions } from "@/lib/db/sanctions"
import { activeSuspensions } from "@/lib/suspensions"
import { getLineup } from "@/lib/db/lineups"
import { getLeagueSettings } from "@/lib/db/settings"
import { LiveSheet } from "./live-sheet"

export default async function PlanillaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const auth = await requireMatchEditor(id)
  if (auth.error) {
    return (
      <div className="rounded-lg border border-border bg-background p-6 text-center">
        <p className="text-sm text-destructive">{auth.error}</p>
        <Link href="/arbitro" className="mt-3 inline-block text-sm text-primary underline">Volver a mis partidos</Link>
      </div>
    )
  }

  const { data: match } = await getMatch(id)
  if (!match) notFound()

  const [{ data: home }, { data: away }, { data: homePlayers }, { data: awayPlayers }, { data: registrations }, events, nextMatchdays, { data: sanctions }, lineup, settings] =
    await Promise.all([
      getTeam(match.homeTeamId),
      getTeam(match.awayTeamId),
      getPlayersByTeam(match.homeTeamId),
      getPlayersByTeam(match.awayTeamId),
      getRegistrations({ tournamentId: match.tournamentId }),
      getMatchEvents(id),
      getNextMatchdays([match.tournamentId]),
      getSanctions({ tournamentIds: [match.tournamentId] }),
      getLineup(id),
      getLeagueSettings(),
    ])
  if (!home || !away) notFound()

  // Players come from each team's lista de buena fe; if it's empty, its active players
  const regs = (registrations ?? []).filter((r) => r.teamId === home.id || r.teamId === away.id)
  const { data: rosters } = await getRosters(regs.map((r) => r.id))
  const byNumber = (a: Player, b: Player) => a.number - b.number || a.name.localeCompare(b.name)
  const sheetTeam = (team: { id: string; name: string; shortName: string; shield: string }, players: Player[]) => {
    const reg = regs.find((r) => r.teamId === team.id)
    const ids = new Set(reg ? rosters.get(reg.id) ?? [] : [])
    const hasList = ids.size > 0
    const roster = (hasList ? players.filter((p) => ids.has(p.id)) : players.filter((p) => p.active)).sort(byNumber)
    const rosterIds = new Set(roster.map((p) => p.id))
    return {
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      shield: team.shield,
      players: roster,
      // Refuerzo candidates: the club's players that aren't on the list
      others: hasList ? players.filter((p) => !rosterIds.has(p.id)).sort(byNumber) : [],
      hasList,
    }
  }

  const suspended = activeSuspensions(sanctions ?? [], nextMatchdays)

  return (
    <div className="flex flex-col gap-4">
      <Link href="/arbitro" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Mis partidos
      </Link>
      <LiveSheet
        match={match}
        home={sheetTeam(home, homePlayers ?? [])}
        away={sheetTeam(away, awayPlayers ?? [])}
        lineup={lineup}
        guestRules={{ allowed: settings.guestPlayersAllowed, maxMatches: settings.guestPlayerMaxMatches }}
        events={events}
        suspendedPlayerIds={[...suspended.keys()]}
      />
    </div>
  )
}
