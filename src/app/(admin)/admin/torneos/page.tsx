import { Suspense } from "react"
import { Plus, Pencil, Trash2, Calendar } from "lucide-react"

import { getTournamentsPaginated } from "@/lib/db/tournaments"
import { getTeams } from "@/lib/db/teams"
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
  const [{ data: tournaments, error, totalPages }, { data: teams }] = await Promise.all([
    getTournamentsPaginated(page, LIMIT),
    getTeams(),
  ])

  if (error) return <div className="flex flex-col items-center justify-center py-20"><p className="text-destructive text-sm">{error}</p></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Torneos</h1><p className="mt-1 text-sm text-muted-foreground">Gestioná los torneos de la liga</p></div>
        <TournamentDialog action={createTournamentAction}>
          <Button className="gap-1.5"><Plus className="h-4 w-4" />Nuevo Torneo</Button>
        </TournamentDialog>
      </div>
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Categoría</TableHead><TableHead>Temporada</TableHead><TableHead>Formato</TableHead><TableHead className="w-40 text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {tournaments.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No hay torneos.</TableCell></TableRow>}
            {tournaments.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-muted-foreground">{t.category}</TableCell>
                <TableCell className="text-muted-foreground">{t.season}</TableCell>
                <TableCell className="text-muted-foreground">{formatLabels[t.format] ?? t.format}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <FixtureDialog tournamentId={t.id} tournamentName={t.name} teams={teams ?? []} action={generateFixtureAction}><Button variant="ghost" size="icon-sm" aria-label="Generar fixture"><Calendar className="h-4 w-4" /></Button></FixtureDialog>
                    <TournamentDialog action={updateTournamentAction.bind(null, t.id)} tournament={t}><Button variant="ghost" size="icon-sm" aria-label="Editar"><Pencil className="h-4 w-4" /></Button></TournamentDialog>
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
