import { Suspense } from "react"
import { Plus, Trash2 } from "lucide-react"
import { getSanctionsPaginated } from "@/lib/db/sanctions"
import { getTeams } from "@/lib/db/teams"
import { getPlayers } from "@/lib/db/players"
import { createSanctionAction, deleteSanctionAction } from "@/lib/actions/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SanctionDialog } from "./dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"

const LIMIT = 10

interface Props { searchParams: Promise<{ page?: string }> }

export default async function SancionesPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1") || 1)
  const [{ data: sanctions, error, totalPages }, { data: teams }, { data: players }] = await Promise.all([
    getSanctionsPaginated(page, LIMIT),
    getTeams(),
    getPlayers(),
  ])

  if (error) return <div className="py-20 text-center"><p className="text-destructive text-sm">{error}</p></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Sanciones</h1><p className="mt-1 text-sm text-muted-foreground">Gestioná las sanciones de la liga</p></div>
        <SanctionDialog action={createSanctionAction} teams={teams ?? []} players={players ?? []}>
          <Button className="gap-1.5"><Plus className="h-4 w-4" />Nueva Sanción</Button>
        </SanctionDialog>
      </div>
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead>Partido</TableHead><TableHead>Tarjeta</TableHead><TableHead>Fecha</TableHead><TableHead>Suspendido</TableHead><TableHead className="w-20 text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {sanctions.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No hay sanciones.</TableCell></TableRow>}
            {sanctions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.playerName}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{s.matchLabel || "—"}</TableCell>
                <TableCell><Badge variant={s.cardType === "red" ? "destructive" : "outline"} className="text-xs">{s.cardType === "red" ? "Roja" : "Amarilla"}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-xs">{s.matchDate || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{s.matchesSuspended > 0 ? `${s.matchesSuspended} fecha(s)` : "—"}</TableCell>
                <TableCell className="text-right">
                  <DeleteConfirmDialog itemName={`Sanción de ${s.playerName}`} onConfirm={deleteSanctionAction.bind(null, s.id)}>
                    <Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </DeleteConfirmDialog>
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
