import type { Standing } from "@/lib/db/standings"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface StandingsTableProps {
  standings: Standing[]
  className?: string
}

/**
 * Reusable standings table component.
 * Used by admin (in torneo detail) and public pages.
 */
export function StandingsTable({ standings, className }: StandingsTableProps) {
  return (
    <div className={cn("rounded-xl border border-border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">Pos</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead className="w-10 text-center">PJ</TableHead>
            <TableHead className="w-8 text-center">G</TableHead>
            <TableHead className="w-8 text-center">E</TableHead>
            <TableHead className="w-8 text-center">P</TableHead>
            <TableHead className="w-10 text-center">GF</TableHead>
            <TableHead className="w-10 text-center">GC</TableHead>
            <TableHead className="w-10 text-center">DG</TableHead>
            <TableHead className="w-10 text-center font-bold">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={10}
                className="py-8 text-center text-sm text-muted-foreground"
              >
                No hay datos de tabla de posiciones todavía.
              </TableCell>
            </TableRow>
          )}
          {standings.map((s, i) => {
            const isTop3 = i < 3
            return (
              <TableRow
                key={s.teamId}
                className={cn(
                  isTop3 && "bg-primary-light"
                )}
              >
                <TableCell className="text-center font-medium tabular-nums">
                  {i + 1}
                </TableCell>
                <TableCell
                  className={cn(
                    "font-medium",
                    isTop3 && "text-primary"
                  )}
                >
                  {s.teamName}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {s.played}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {s.won}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {s.drawn}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {s.lost}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {s.goalsFor}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {s.goalsAgainst}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-center tabular-nums",
                    s.goalDifference > 0
                      ? "text-success"
                      : s.goalDifference < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                  )}
                >
                  {s.goalDifference > 0 ? "+" : ""}
                  {s.goalDifference}
                </TableCell>
                <TableCell className="text-center font-bold tabular-nums">
                  {s.points}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
