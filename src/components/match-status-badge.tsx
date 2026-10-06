import type { Match } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const LABELS: Record<Match["status"], string> = {
  scheduled: "Programado",
  ongoing: "En juego",
  finished: "Final",
  postponed: "Suspendido",
  cancelled: "Cancelado",
}

export function matchStatusLabel(match: Pick<Match, "status" | "walkover">): string {
  if (match.status === "finished" && match.walkover) return "W.O."
  return LABELS[match.status] ?? match.status
}

/** Final / W.O. / Suspendido / Cancelado / En juego / Programado */
export function MatchStatusBadge({
  match,
  className,
}: {
  match: Pick<Match, "status" | "walkover">
  className?: string
}) {
  const tone =
    match.status === "finished"
      ? "text-success border-success/30 bg-success-soft"
      : match.status === "postponed"
        ? "text-amber-700 border-amber-300 bg-amber-50"
        : match.status === "cancelled"
          ? "text-destructive border-destructive/30 bg-destructive/5"
          : ""
  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase", tone, className)}>
      {matchStatusLabel(match)}
    </Badge>
  )
}
