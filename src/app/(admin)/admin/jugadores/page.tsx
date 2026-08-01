import { Suspense } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { getPlayersPaginated } from "@/lib/db/players"
import { getTeams } from "@/lib/db/teams"
import { createPlayerAction, updatePlayerAction, deletePlayerAction } from "@/lib/actions/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlayerDialog } from "./dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"

const LIMIT = 10
const positionLabels: Record<string, string> = { arquero: "Arquero", defensa: "Defensa", mediocampista: "Mediocampista", delantero: "Delantero" }

interface Props { searchParams: Promise<{ page?: string }> }

export default async function JugadoresPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1") || 1)
  const [{ data: players, error, totalPages }, { data: teams }] = await Promise.all([
    getPlayersPaginated(page, LIMIT),
    getTeams(),
  ])

  if (error) return <div className="py-20 text-center"><p className="text-destructive text-sm">{error}</p></div>
  const teamsList = teams ?? []
  const teamMap = new Map(teamsList.map((t) => [t.id, t]))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Jugadores</h1><p className="mt-1 text-sm text-muted-foreground">Gestioná los jugadores de la liga</p></div>
        <PlayerDialog action={createPlayerAction} teams={teamsList}>
          <Button className="gap-1.5"><Plus className="h-4 w-4" />Nuevo Jugador</Button>
        </PlayerDialog>
      </div>
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Equipo</TableHead><TableHead>Posición</TableHead><TableHead>N°</TableHead><TableHead className="w-24 text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {players.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No hay jugadores.</TableCell></TableRow>}
            {players.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{teamMap.get(p.teamId)?.shortName ?? "—"}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{positionLabels[p.position] ?? p.position}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{p.number || "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <PlayerDialog action={updatePlayerAction.bind(null, p.id)} player={p} teams={teamsList}><Button variant="ghost" size="icon-sm"><Pencil className="h-4 w-4" /></Button></PlayerDialog>
                    <DeleteConfirmDialog itemName={p.name} onConfirm={deletePlayerAction.bind(null, p.id)}><Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></DeleteConfirmDialog>
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
