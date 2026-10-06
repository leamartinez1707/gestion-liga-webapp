import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ListChecks, Trash2 } from "lucide-react"

import { getTournament } from "@/lib/db/tournaments"
import { getTeams } from "@/lib/db/teams"
import { getPlayers } from "@/lib/db/players"
import { getSeriesOptions } from "@/lib/db/series"
import { getRegistrations, getRosters } from "@/lib/db/registrations"
import { scopeLabel } from "@/lib/scope"
import {
  registerTeamAction,
  unregisterTeamAction,
  setRosterAction,
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
import { RegisterForm } from "./register-form"

export default async function TorneoInscripcionesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: tournament } = await getTournament(id)
  if (!tournament) notFound()

  const [{ data: teams }, { data: players }, { data: registrations }, series] = await Promise.all([
    getTeams(),
    getPlayers(),
    getRegistrations({ tournamentId: id }),
    getSeriesOptions(),
  ])
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
    </div>
  )
}
