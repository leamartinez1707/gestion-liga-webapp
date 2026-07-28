import type { Standing } from "@/lib/db/standings"
import { cn } from "@/lib/utils"

interface StandingsSidebarProps {
  standings: Standing[]
  className?: string
}

export function StandingsSidebar({ standings, className }: StandingsSidebarProps) {
  return (
    <div className={cn("", className)}>
      <h3 className="text-sm font-semibold text-foreground mb-3">Tabla de Posiciones</h3>
      {standings.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin datos todavía.</p>
      ) : (
        <div className="space-y-0.5">
          {standings.slice(0, 8).map((s, i) => (
            <div
              key={s.teamId}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
                i < 3 ? "bg-primary-light" : "hover:bg-muted-bg"
              )}
            >
              <span
                className={cn(
                  "w-5 text-center font-bold tabular-nums shrink-0",
                  i === 0 && "text-amber-500",
                  i === 1 && "text-gray-400",
                  i === 2 && "text-amber-700"
                )}
              >
                {i + 1}
              </span>
              <span className="flex-1 truncate font-medium text-foreground">
                {s.teamName}
              </span>
              <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                <span className="tabular-nums w-4 text-center">{s.played}</span>
                <span className="tabular-nums w-4 text-center">{s.won}</span>
                <span className="tabular-nums w-4 text-center">{s.drawn}</span>
                <span className="tabular-nums w-4 text-center">{s.lost}</span>
                <span className="tabular-nums w-5 text-center font-bold text-foreground">
                  {s.points}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Column headers */}
      {standings.length > 0 && (
        <div className="flex items-center justify-end gap-2 px-2 pt-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
          <span className="w-4 text-center">PJ</span>
          <span className="w-4 text-center">G</span>
          <span className="w-4 text-center">E</span>
          <span className="w-4 text-center">P</span>
          <span className="w-5 text-center">Pts</span>
        </div>
      )}
    </div>
  )
}
