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

const PERIODS: Record<NonNullable<Match["livePeriod"]>, string> = { "1T": "1T", ET: "Entretiempo", "2T": "2T" }

export function matchStatusLabel(match: Pick<Match, "status" | "walkover" | "livePeriod">): string {
  if (match.status === "finished" && match.walkover) return "W.O."
  if (match.status === "ongoing" && match.livePeriod) return `En vivo · ${PERIODS[match.livePeriod]}`
  return LABELS[match.status] ?? match.status
}

/** Final / W.O. / Suspendido / Cancelado / En juego / Programado */
export function MatchStatusBadge({
  match,
  className,
}: {
  match: Pick<Match, "status" | "walkover" | "livePeriod">
  className?: string
}) {
  const tone =
    match.status === "finished"
      ? "text-success border-success/30 bg-success-soft"
      : match.status === "postponed"
        ? "text-amber-700 border-amber-300 bg-amber-50"
        : match.status === "cancelled"
          ? "text-destructive border-destructive/30 bg-destructive/5"
          : match.status === "ongoing"
            ? "text-white border-red-600 bg-red-600 animate-pulse"
            : ""
  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase", tone, className)}>
      {matchStatusLabel(match)}
    </Badge>
  )
}
