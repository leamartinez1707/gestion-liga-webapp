import { Suspense } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { getMatchesPaginated } from "@/lib/db/matches"
import { getTeams } from "@/lib/db/teams"
import { getTournaments } from "@/lib/db/tournaments"
import { createMatchAction, updateMatchAction, deleteMatchAction } from "@/lib/actions/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MatchDialog } from "./dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"

const LIMIT = 10

interface Props { searchParams: Promise<{ page?: string }> }

export default async function PartidosPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1") || 1)
  const [{ data: matches, error, totalPages }, { data: teams }, { data: tournaments }] = await Promise.all([
    getMatchesPaginated(page, LIMIT),
    getTeams(),
    getTournaments(),
  ])

  if (error) return <div className="py-20 text-center"><p className="text-destructive text-sm">{error}</p></div>
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Partidos</h1><p className="mt-1 text-sm text-muted-foreground">Gestioná los partidos de la liga</p></div>
        <MatchDialog action={createMatchAction} teams={teams ?? []} tournaments={tournaments ?? []}>
          <Button className="gap-1.5"><Plus className="h-4 w-4" />Nuevo Partido</Button>
        </MatchDialog>
      </div>
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Local</TableHead><TableHead>Resultado</TableHead><TableHead>Visitante</TableHead><TableHead>Estado</TableHead><TableHead className="w-24 text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {matches.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No hay partidos.</TableCell></TableRow>}
            {matches.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{m.date} · F{m.matchday}</TableCell>
                <TableCell className="font-medium">{m.homeTeamName}</TableCell>
                <TableCell>{m.status === "finished" ? <span className="font-bold tabular-nums">{m.homeScore} - {m.awayScore}</span> : "—"}</TableCell>
                <TableCell className="font-medium">{m.awayTeamName}</TableCell>
                <TableCell><Badge variant={m.status === "finished" ? "default" : "outline"} className="text-xs">{m.status === "finished" ? "Finalizado" : "Programado"}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <MatchDialog action={updateMatchAction.bind(null, m.id)} match={m} teams={teams ?? []} tournaments={tournaments ?? []}><Button variant="ghost" size="icon-sm"><Pencil className="h-4 w-4" /></Button></MatchDialog>
                    <DeleteConfirmDialog itemName={`${m.homeTeamName} vs ${m.awayTeamName}`} onConfirm={deleteMatchAction.bind(null, m.id)}><Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></DeleteConfirmDialog>
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
