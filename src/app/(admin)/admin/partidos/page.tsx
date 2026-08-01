import { Plus, Pencil, Trash2 } from "lucide-react"

import { getMatches } from "@/lib/db/matches"
import { getTournaments } from "@/lib/db/tournaments"
import { getTeams } from "@/lib/db/teams"
import {
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
import { Badge } from "@/components/ui/badge"
import { MatchDialog } from "./dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { MatchFilter } from "./filter"

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  scheduled: { label: "Programado", variant: "outline" },
  ongoing: { label: "En juego", variant: "secondary" },
  finished: { label: "Finalizado", variant: "default" },
}

export default async function PartidosPage(props: {
  searchParams?: Promise<{ tournament?: string }>
}) {
  const searchParams = await props.searchParams
  const tournamentFilter = searchParams?.tournament

  const { data: allMatches, error: matchesError } = await getMatches(tournamentFilter)
  const { data: tournaments } = await getTournaments()
  const { data: teams } = await getTeams()

  if (matchesError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive text-sm font-medium">{matchesError}</p>
      </div>
    )
  }

  const matchesList = allMatches ?? []
  const tournamentsList = tournaments ?? []
  const teamsList = teams ?? []

  const teamMap = new Map(teamsList.map((t) => [t.id, { name: t.name, shortName: t.shortName }]))
  const tournamentMap = new Map(tournamentsList.map((t) => [t.id, t.name]))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Partidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná los partidos de la liga
          </p>
        </div>
        <MatchDialog action={createMatchAction} tournaments={tournamentsList} teams={teamsList}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo Partido
          </Button>
        </MatchDialog>
      </div>

      {/* Filter */}
      <MatchFilter tournaments={tournamentsList} currentTournament={tournamentFilter} />

      {/* Table */}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Local</TableHead>
              <TableHead className="w-16 text-center">Resultado</TableHead>
              <TableHead>Visitante</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Jornada</TableHead>
              <TableHead className="w-24 text-center">Estado</TableHead>
              <TableHead className="w-20 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matchesList.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No hay partidos{tournamentFilter ? " para este torneo" : " todavía"}.
                </TableCell>
              </TableRow>
            )}
            {matchesList.map((m) => {
              const st = statusLabels[m.status] ?? statusLabels.scheduled
              const localName = teamMap.get(m.homeTeamId)?.shortName ?? m.homeTeamName
              const awayName = teamMap.get(m.awayTeamId)?.shortName ?? m.awayTeamName
              const showScore = m.status === "finished" && m.homeScore !== undefined

              return (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{localName}</TableCell>
                  <TableCell className="text-center">
                    {showScore ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
                        <span className={m.homeScore! > m.awayScore! ? "text-foreground" : "text-muted-foreground"}>
                          {m.homeScore}
                        </span>
                        <span className="text-muted-foreground">–</span>
                        <span className={m.awayScore! > m.homeScore! ? "text-foreground" : "text-muted-foreground"}>
                          {m.awayScore}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">vs</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{awayName}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {m.date
                      ? new Date(m.date + "T12:00:00").toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}{" "}
                    <span className="text-xs">{m.time ?? ""}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.matchday ? `Fecha ${m.matchday}` : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={st.variant} className="text-xs">
                      {st.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <MatchDialog
                        action={updateMatchAction.bind(null, m.id)}
                        match={m}
                        tournaments={tournamentsList}
                        teams={teamsList}
                      >
                        <Button variant="ghost" size="icon-sm" aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </MatchDialog>
                      <DeleteConfirmDialog
                        itemName={`${localName} vs ${awayName}`}
                        onConfirm={deleteMatchAction.bind(null, m.id)}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Eliminar"
                          className="text-destructive hover:text-destructive"
                        >
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
