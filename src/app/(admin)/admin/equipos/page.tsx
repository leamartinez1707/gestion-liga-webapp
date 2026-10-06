import { Suspense } from "react"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import Link from "next/link"

import { getTeamsPaginated } from "@/lib/db/teams"
import { getSeriesOptions } from "@/lib/db/series"
import { getTournaments } from "@/lib/db/tournaments"
import { getRegistrations } from "@/lib/db/registrations"
import { scopeLabel } from "@/lib/scope"
import { createTeamAction, updateTeamAction, deleteTeamAction } from "@/lib/actions/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TeamDialog } from "./dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"

const LIMIT = 10

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function EquiposPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1") || 1)

  const [{ data: teams, error, totalPages }, series, { data: tournaments }, { data: registrations }] =
    await Promise.all([getTeamsPaginated(page, LIMIT), getSeriesOptions(), getTournaments(), getRegistrations()])

  const tournamentMap = new Map((tournaments ?? []).map((t) => [t.id, t]))
  // "Serie 1 · División A (2026)" for each tournament the team is entered in
  const registrationsOf = (teamId: string) =>
    (registrations ?? [])
      .filter((r) => r.teamId === teamId)
      .map((r) => tournamentMap.get(r.tournamentId))
      .filter((t) => t !== undefined)
      .map((t) => `${scopeLabel(series, t.seriesId, t.divisionId)} (${t.season})`)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive text-sm font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Equipos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestioná los equipos de la liga</p>
        </div>
        <TeamDialog action={createTeamAction}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Nuevo Equipo
          </Button>
        </TeamDialog>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Inscripciones</TableHead>
              <TableHead>DT</TableHead>
              <TableHead className="w-28 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No hay equipos. Creá el primero.
                </TableCell>
              </TableRow>
            )}
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell className="text-muted-foreground whitespace-normal">
                  {registrationsOf(team.id).join(", ") || "Sin inscripciones"}
                </TableCell>
                <TableCell className="text-muted-foreground">{team.coach || "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/equipos/${team.id}`}>
                      <Button variant="ghost" size="icon-sm" aria-label="Ver plantel">
                        <Users className="h-4 w-4" />
                      </Button>
                    </Link>
                    <TeamDialog action={updateTeamAction.bind(null, team.id)} team={team}>
                      <Button variant="ghost" size="icon-sm" aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TeamDialog>
                    <DeleteConfirmDialog itemName={team.name} onConfirm={deleteTeamAction.bind(null, team.id)}>
                      <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DeleteConfirmDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Suspense>
        <Pagination page={page} totalPages={totalPages} />
      </Suspense>
    </div>
  )
}
