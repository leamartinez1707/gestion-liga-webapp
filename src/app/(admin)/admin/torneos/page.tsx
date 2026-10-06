import { Suspense } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, Calendar, Users } from "lucide-react"

import { getTournamentsPaginated } from "@/lib/db/tournaments"
import { getTeams } from "@/lib/db/teams"
import { getSeriesOptions } from "@/lib/db/series"
import { getRegistrations } from "@/lib/db/registrations"
import { scopeLabel } from "@/lib/scope"
import {
  createTournamentAction,
  updateTournamentAction,
  deleteTournamentAction,
  generateFixtureAction,
} from "@/lib/actions/admin"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TournamentDialog } from "./dialog"
import { FixtureDialog } from "./fixture-dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"

const LIMIT = 10
const formatLabels: Record<string, string> = { league: "Liga", elimination: "Eliminatoria", groups: "Grupos" }

interface Props { searchParams: Promise<{ page?: string }> }

export default async function TorneosPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1") || 1)
  const [{ data: tournaments, error, totalPages }, { data: teams }, series, { data: registrations }] =
    await Promise.all([getTournamentsPaginated(page, LIMIT), getTeams(), getSeriesOptions(), getRegistrations()])
  // Fixture only between the teams entered in the tournament
  const teamsOf = (tournamentId: string) => {
    const ids = new Set((registrations ?? []).filter((r) => r.tournamentId === tournamentId).map((r) => r.teamId))
    return (teams ?? []).filter((team) => ids.has(team.id))
  }

  if (error) return <div className="flex flex-col items-center justify-center py-20"><p className="text-destructive text-sm">{error}</p></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Torneos</h1><p className="mt-1 text-sm text-muted-foreground">Gestioná los torneos de la liga</p></div>
        <TournamentDialog action={createTournamentAction} series={series}>
          <Button className="gap-1.5"><Plus className="h-4 w-4" />Nuevo Torneo</Button>
        </TournamentDialog>
      </div>
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Serie · División</TableHead><TableHead>Temporada</TableHead><TableHead>Equipos</TableHead><TableHead className="w-44 text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {tournaments.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No hay torneos.</TableCell></TableRow>}
            {tournaments.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-muted-foreground">{scopeLabel(series, t.seriesId, t.divisionId)}</TableCell>
                <TableCell className="text-muted-foreground">{t.season} · {formatLabels[t.format] ?? t.format}</TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/admin/torneos/${t.id}`} className="hover:text-primary hover:underline">
                    {teamsOf(t.id).length} inscriptos
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/torneos/${t.id}`}><Button variant="ghost" size="icon-sm" aria-label="Inscripciones"><Users className="h-4 w-4" /></Button></Link>
                    <FixtureDialog tournamentId={t.id} tournamentName={t.name} teams={teamsOf(t.id)} action={generateFixtureAction}><Button variant="ghost" size="icon-sm" aria-label="Generar fixture"><Calendar className="h-4 w-4" /></Button></FixtureDialog>
                    <TournamentDialog action={updateTournamentAction.bind(null, t.id)} tournament={t} series={series}><Button variant="ghost" size="icon-sm" aria-label="Editar"><Pencil className="h-4 w-4" /></Button></TournamentDialog>
                    <DeleteConfirmDialog itemName={t.name} onConfirm={deleteTournamentAction.bind(null, t.id)}><Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button></DeleteConfirmDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Suspense><Pagination page={page} totalPages={totalPages} /></Suspense>
    </div>
  )
}
