import { Suspense } from "react"
import { Plus, Pencil, Trash2, CalendarX } from "lucide-react"
import { getMatchesPaginated } from "@/lib/db/matches"
import { getTeamsByIds } from "@/lib/db/teams"
import { getRegistrations } from "@/lib/db/registrations"
import { getGoalsByMatch } from "@/lib/db/goals"
import { getSanctions } from "@/lib/db/sanctions"
import { getReferees } from "@/lib/db/referees"
import { getMatchIdsWithEvents } from "@/lib/db/match-events"
import { getPlayersByTeams } from "@/lib/db/players"
import { getTournaments } from "@/lib/db/tournaments"
import { createMatchAction, updateMatchAction, deleteMatchAction } from "@/lib/actions/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MatchDialog } from "./dialog"
import { SuspendMatchdayDialog } from "./suspend-dialog"
import { MatchStatusBadge } from "@/components/match-status-badge"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { PartidosViewToggle } from "./view-toggle"
import { SeasonFilter } from "./filter"

const LIMIT = 10

interface Props { searchParams: Promise<{ page?: string; temporada?: string }> }

/** Current year if some tournament is from it, otherwise the newest season. */
function defaultSeason(seasons: string[]): string {
  const year = String(new Date().getFullYear())
  return seasons.includes(year) ? year : seasons[0] ?? ""
}

export default async function PartidosPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1") || 1)

  // Everything on this page belongs to one season, so the load doesn't grow with the league's history
  const { data: allTournaments } = await getTournaments()
  const seasons = [...new Set((allTournaments ?? []).map((t) => t.season))].sort((a, b) => b.localeCompare(a))
  const season = params.temporada && seasons.includes(params.temporada) ? params.temporada : defaultSeason(seasons)
  const tournaments = (allTournaments ?? []).filter((t) => t.season === season)
  const tournamentIds = tournaments.map((t) => t.id)

  const [{ data: matches, error, totalPages }, { data: registrations }] = await Promise.all([
    getMatchesPaginated(page, LIMIT, tournamentIds),
    // The dialogs only offer this season's tournaments and the teams entered in them
    getRegistrations({ tournamentIds }),
  ])

  if (error) return <div className="py-20 text-center"><p className="text-destructive text-sm">{error}</p></div>
  const matchesList = matches || []
  // Players are only used when editing a match (scorers, red cards): just the teams on this page
  const pageTeamIds = matchesList.flatMap((m) => [m.homeTeamId, m.awayTeamId])
  const [goalsByMatch, { data: sanctions }, referees, withSheet, { data: teams }, { data: players }] = await Promise.all([
    getGoalsByMatch(matchesList.map((m) => m.id)),
    getSanctions({ matchIds: matchesList.map((m) => m.id) }),
    getReferees(),
    getMatchIdsWithEvents(matchesList.map((m) => m.id)),
    getTeamsByIds([...(registrations ?? []).map((r) => r.teamId), ...pageTeamIds]),
    getPlayersByTeams(pageTeamIds),
  ])
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]))
  const playersOf = (m: { homeTeamId: string; awayTeamId: string }) =>
    (players ?? []).filter((p) => p.teamId === m.homeTeamId || p.teamId === m.awayTeamId)
  const redCardsOf = (matchId: string) =>
    (sanctions ?? []).filter((s) => s.matchId === matchId && s.cardType === "red").map((s) => s.playerId)

  // Plain object: functions can't be passed to the client toggle
  const shortNames = Object.fromEntries([...teamMap].map(([id, t]) => [id, t.shortName]))

  const listView = (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Local</TableHead><TableHead>Resultado</TableHead><TableHead>Visitante</TableHead><TableHead>Estado</TableHead><TableHead className="w-24 text-right">Acciones</TableHead></TableRow></TableHeader>
        <TableBody>
          {matchesList.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No hay partidos.</TableCell></TableRow>}
          {matchesList.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{m.date || "Sin fecha"} · F{m.matchday}</TableCell>
              <TableCell className="font-medium">{m.homeTeamName}</TableCell>
              <TableCell>{m.status === "finished" ? <span className="font-bold tabular-nums">{m.homeScore} - {m.awayScore}</span> : "—"}</TableCell>
              <TableCell className="font-medium">{m.awayTeamName}</TableCell>
              <TableCell><MatchStatusBadge match={m} /></TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <MatchDialog action={updateMatchAction.bind(null, m.id)} match={m} existingGoals={goalsByMatch.get(m.id)} redCardPlayerIds={redCardsOf(m.id)} referees={referees} hasSheet={withSheet.has(m.id)} teams={teams ?? []} registrations={registrations ?? []} tournaments={tournaments} players={playersOf(m)}><Button variant="ghost" size="icon-sm"><Pencil className="h-4 w-4" /></Button></MatchDialog>
                  <DeleteConfirmDialog itemName={`${m.homeTeamName} vs ${m.awayTeamName}`} onConfirm={deleteMatchAction.bind(null, m.id)}><Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></DeleteConfirmDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Partidos</h1><p className="mt-1 text-sm text-muted-foreground">Gestioná los partidos de la liga</p></div>
        <div className="flex items-center gap-2">
          <SeasonFilter seasons={seasons} current={season} />
          {/* New match: no players needed (scorers and cards are loaded when editing) */}
          <MatchDialog action={createMatchAction} teams={teams ?? []} registrations={registrations ?? []} tournaments={tournaments} players={[]}>
            <Button className="gap-1.5"><Plus className="h-4 w-4" />Nuevo Partido</Button>
          </MatchDialog>
          <SuspendMatchdayDialog tournaments={tournaments}>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
              <CalendarX className="h-4 w-4" /> Suspender Fecha
            </Button>
          </SuspendMatchdayDialog>
        </div>
      </div>

      <PartidosViewToggle matches={matchesList} shortNames={shortNames} listView={listView} />

      <Suspense><Pagination page={page} totalPages={totalPages} /></Suspense>
    </div>
  )
}
