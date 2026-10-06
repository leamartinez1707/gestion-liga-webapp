import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ListChecks, Trash2, UserMinus, Pencil, Plus, ClipboardList } from "lucide-react"

import { getTournament } from "@/lib/db/tournaments"
import { getTeams } from "@/lib/db/teams"
import { getPlayers } from "@/lib/db/players"
import { getSeriesOptions } from "@/lib/db/series"
import { getRegistrations, getRosters } from "@/lib/db/registrations"
import { getMatches } from "@/lib/db/matches"
import { getGoalsByMatch } from "@/lib/db/goals"
import { getSanctions } from "@/lib/db/sanctions"
import { getReferees } from "@/lib/db/referees"
import { getMatchIdsWithEvents } from "@/lib/db/match-events"
import { scopeLabel } from "@/lib/scope"
import {
  registerTeamAction,
  unregisterTeamAction,
  withdrawTeamAction,
  setRosterAction,
  createMatchAction,
  updateMatchAction,
  deleteMatchAction,
} from "@/lib/actions/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { PhotoAvatar } from "@/components/photo-avatar"
import { RosterDialog } from "@/components/roster-dialog"
import { Badge } from "@/components/ui/badge"
import { MatchStatusBadge } from "@/components/match-status-badge"
import { MatchDialog } from "../../partidos/dialog"
import { RegisterForm } from "./register-form"

export default async function TorneoInscripcionesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: tournament } = await getTournament(id)
  if (!tournament) notFound()

  const [{ data: teams }, { data: players }, { data: registrations }, series, { data: matches }] = await Promise.all([
    getTeams(),
    getPlayers(),
    getRegistrations({ tournamentId: id }),
    getSeriesOptions(),
    getMatches(id),
  ])
  const matchdays = [...new Set((matches ?? []).map((m) => m.matchday))].sort((a, b) => a - b)
  const [goalsByMatch, { data: sanctions }, referees, withSheet] = await Promise.all([
    getGoalsByMatch((matches ?? []).map((m) => m.id)),
    getSanctions(),
    getReferees(),
    getMatchIdsWithEvents((matches ?? []).map((m) => m.id)),
  ])
  const refereeEmail = new Map(referees.map((r) => [r.id, r.email]))
  const redCardsOf = (matchId: string) =>
    (sanctions ?? []).filter((s) => s.matchId === matchId && s.cardType === "red").map((s) => s.playerId)
  const registrationList = registrations ?? []
  const { data: rosters } = await getRosters(registrationList.map((r) => r.id))

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]))
  const registeredIds = new Set(registrationList.map((r) => r.teamId))
  const available = (teams ?? [])
    .filter((t) => !registeredIds.has(t.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  const rows = registrationList
    .flatMap((registration) => {
      const team = teamMap.get(registration.teamId)
      return team ? [{ registration, team }] : []
    })
    .sort((a, b) => a.team.name.localeCompare(b.team.name))

  const label = `${scopeLabel(series, tournament.seriesId, tournament.divisionId)} (${tournament.season})`

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/torneos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a torneos
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>

      <div className="rounded-xl border border-border p-6 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Inscribir equipo</h2>
        <p className="text-sm text-muted-foreground">
          Un equipo puede jugar en varias series, pero no en dos divisiones de la misma serie en una temporada.
        </p>
        <RegisterForm teams={available} action={registerTeamAction.bind(null, id)} />
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipo inscripto</TableHead>
              <TableHead>Lista de buena fe</TableHead>
              <TableHead className="w-28 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Todavía no hay equipos inscriptos.
                </TableCell>
              </TableRow>
            )}
            {rows.map(({ registration, team }) => {
              const roster = rosters.get(registration.id) ?? []
              const teamPlayers = (players ?? []).filter((p) => p.teamId === team.id)
              return (
                <TableRow key={registration.id}>
                  <TableCell>
                    <span className="flex items-center gap-2 font-medium">
                      <PhotoAvatar src={team.shield} name={team.name} className="size-7" fallbackClassName="text-[10px]" />
                      {team.name}
                      {registration.withdrawnAt && <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">BAJA</Badge>}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {roster.length} {roster.length === 1 ? "jugador" : "jugadores"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <RosterDialog
                        title={`${team.name} · ${label}`}
                        players={teamPlayers}
                        selectedIds={roster}
                        action={setRosterAction.bind(null, registration.id)}
                      >
                        <Button variant="ghost" size="icon-sm" aria-label="Lista de buena fe">
                          <ListChecks className="h-4 w-4" />
                        </Button>
                      </RosterDialog>
                      {!registration.withdrawnAt && (
                        <DeleteConfirmDialog
                          itemName={team.name}
                          title={`Dar de baja a ${team.name}`}
                          description="Los partidos ya jugados quedan como están. Los que faltan se dan por ganados 3-0 (W.O.) a cada rival. No se puede deshacer."
                          confirmLabel="Dar de baja"
                          pendingLabel="Dando de baja…"
                          onConfirm={withdrawTeamAction.bind(null, registration.id)}
                        >
                          <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Dar de baja">
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </DeleteConfirmDialog>
                      )}
                      <DeleteConfirmDialog
                        itemName={`la inscripción de ${team.name}`}
                        onConfirm={unregisterTeamAction.bind(null, registration.id)}
                      >
                        <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Quitar inscripción">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DeleteConfirmDialog>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Fixture */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fixture</h2>
        <MatchDialog
          action={createMatchAction}
          teams={teams ?? []}
          registrations={registrationList}
          tournaments={[tournament]}
          players={players ?? []}
          defaultTournamentId={tournament.id}
        >
          <Button variant="outline" size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Agregar partido</Button>
        </MatchDialog>
      </div>
      {matchdays.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay partidos. Generá el fixture desde el listado de torneos o agregalos a mano.
        </p>
      ) : (
        matchdays.map((md) => (
          <div key={md} className="rounded-xl border border-border">
            <div className="px-4 py-2 border-b border-border text-sm font-semibold">Fecha {md}</div>
            <Table>
              <TableBody>
                {(matches ?? []).filter((m) => m.matchday === md).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap w-32">
                      {m.date || "Sin fecha"}{m.time && ` · ${m.time.slice(0, 5)}`}
                    </TableCell>
                    <TableCell className="font-medium">
                      {m.homeTeamName}
                      <span className="mx-2 tabular-nums font-bold">
                        {m.status === "finished" ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                      </span>
                      {m.awayTeamName}
                      {m.notes && <span className="block text-xs text-muted-foreground font-normal">{m.notes}</span>}
                      <span className="block text-xs text-muted-foreground font-normal">
                        Árbitro: {m.refereeId ? refereeEmail.get(m.refereeId) ?? "—" : "sin asignar"}
                      </span>
                    </TableCell>
                    <TableCell className="w-28"><MatchStatusBadge match={m} /></TableCell>
                    <TableCell className="w-32 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <MatchDialog
                          action={updateMatchAction.bind(null, m.id)}
                          match={m}
                          existingGoals={goalsByMatch.get(m.id)}
                          redCardPlayerIds={redCardsOf(m.id)}
                          referees={referees}
                          hasSheet={withSheet.has(m.id)}
                          teams={teams ?? []}
                          registrations={registrationList}
                          tournaments={[tournament]}
                          players={players ?? []}
                        >
                          <Button variant="ghost" size="icon-sm" aria-label="Editar partido"><Pencil className="h-4 w-4" /></Button>
                        </MatchDialog>
                        <Button variant="ghost" size="icon-sm" aria-label="Planilla" render={<Link href={`/arbitro/partido/${m.id}`} />}>
                          <ClipboardList className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          itemName={`${m.homeTeamName} vs ${m.awayTeamName}`}
                          onConfirm={deleteMatchAction.bind(null, m.id)}
                        >
                          <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Eliminar partido"><Trash2 className="h-4 w-4" /></Button>
                        </DeleteConfirmDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))
      )}
    </div>
  )
}
