import { Suspense } from "react"
import { Plus, Trash2 } from "lucide-react"
import { getSanctions, getSanctionsPaginated } from "@/lib/db/sanctions"
import { ListFilters } from "@/components/admin/list-filters"
import { getTeams } from "@/lib/db/teams"
import { getPlayers } from "@/lib/db/players"
import { getMatches, getNextMatchdays } from "@/lib/db/matches"
import { activeSuspensions, sanctionTournamentIds } from "@/lib/suspensions"
import { createSanctionAction, deleteSanctionAction } from "@/lib/actions/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SanctionDialog } from "./dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"

const LIMIT = 10

interface Props { searchParams: Promise<{ page?: string; q?: string; equipo?: string; tipo?: string; estado?: string }> }

export default async function SancionesPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1") || 1)
  const [{ data: teams }, { data: players }, { data: matches }, { data: suspending }] = await Promise.all([
    getTeams(),
    getPlayers(),
    // A card comes from a match that was played: the dialog only lists those
    getMatches({ statuses: ["finished", "ongoing"] }),
    // "Vigentes": only sanctions that suspend can still apply
    params.estado === "vigentes" ? getSanctions({ suspendingOnly: true }) : Promise.resolve({ data: null }),
  ])

  // "Vigentes": suspensions that still apply to the next matchday of their tournament
  const vigentes = suspending
    ? await getNextMatchdays(sanctionTournamentIds(suspending)).then((next) =>
        suspending.filter((s) => activeSuspensions([s], next).has(s.playerId)).map((s) => s.id)
      )
    : undefined
  // Player name and team are filtered in the query
  const { data: sanctions, error, total, totalPages } = await getSanctionsPaginated(page, LIMIT, {
    q: params.q,
    teamId: params.equipo,
    ids: vigentes,
    cardType: params.tipo,
  })
  const nextMatchdays = await getNextMatchdays(sanctionTournamentIds(sanctions))
  const filtering = !!(params.q || params.equipo || params.tipo || params.estado)

  if (error) return <div className="py-20 text-center"><p className="text-destructive text-sm">{error}</p></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Sanciones</h1><p className="mt-1 text-sm text-muted-foreground">Gestioná las sanciones de la liga</p></div>
        <SanctionDialog action={createSanctionAction} teams={teams ?? []} players={players ?? []} matches={matches ?? []}>
          <Button className="gap-1.5"><Plus className="h-4 w-4" />Nueva Sanción</Button>
        </SanctionDialog>
      </div>
      <Suspense>
        <ListFilters
          searchPlaceholder="Buscar por jugador"
          selects={[
            { param: "equipo", allLabel: "Todos los equipos", options: [...(teams ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((t) => ({ value: t.id, label: t.name })) },
            { param: "tipo", allLabel: "Todas las tarjetas", options: [{ value: "yellow", label: "Amarillas" }, { value: "red", label: "Rojas" }, { value: "accumulation", label: "Acumulación" }] },
            { param: "estado", allLabel: "Vigentes y cumplidas", options: [{ value: "vigentes", label: "Solo vigentes" }] },
          ]}
          resultLabel={`${total} ${total === 1 ? "sanción" : "sanciones"}`}
        />
      </Suspense>
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead>Partido</TableHead><TableHead>Tarjeta</TableHead><TableHead>Fecha</TableHead><TableHead>Suspensión</TableHead><TableHead className="w-20 text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {sanctions.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">{filtering ? "Ninguna sanción coincide con la búsqueda." : "No hay sanciones."}</TableCell></TableRow>}
            {sanctions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.playerName}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{s.matchLabel || "—"}</TableCell>
                <TableCell><Badge variant={s.cardType === "red" ? "destructive" : "outline"} className="text-xs">{s.cardType === "red" ? "Roja" : s.cardType === "accumulation" ? "Acumulación" : "Amarilla"}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-xs">{s.matchDate || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {s.matchesSuspended > 0 ? (
                    <>
                      {s.matchesSuspended} {s.matchesSuspended === 1 ? "fecha" : "fechas"}
                      {activeSuspensions([s], nextMatchdays).has(s.playerId) ? (
                        <Badge variant="destructive" className="ml-2 text-[10px]">Vigente</Badge>
                      ) : s.matchId ? (
                        <Badge variant="outline" className="ml-2 text-[10px]">Cumplida</Badge>
                      ) : null}
                    </>
                  ) : "—"}
                </TableCell>
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
