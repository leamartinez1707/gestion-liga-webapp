import type { Standing } from "@/lib/db/standings"
import { cn } from "@/lib/utils"

interface StandingsSidebarProps {
  standings: Standing[]
  className?: string
}

export function StandingsSidebar({ standings, className }: StandingsSidebarProps) {
  return (
    <div className={cn("", className)}>
      <h3 className="text-sm font-semibold text-foreground mb-3">Posiciones</h3>
      {standings.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin datos todavía.</p>
      ) : (
        <div className="space-y-1">
          {standings.slice(0, 10).map((s, i) => (
            <div
              key={s.teamId}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
                i < 3 ? "bg-primary-light" : "hover:bg-muted-bg"
              )}
            >
              {/* Position badge */}
              <span
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0",
                  i === 0 && "bg-amber-400 text-white",
                  i === 1 && "bg-gray-300 text-gray-600",
                  i === 2 && "bg-amber-700 text-white",
                  i >= 3 && "bg-muted-bg text-muted-foreground"
                )}
              >
                {i + 1}
              </span>

              {/* Team name */}
              <span className="flex-1 font-bold text-foreground min-w-0 leading-tight">
                {s.teamName}
              </span>
              <div className="flex items-center gap-x-2">
              {/* Points */}
              <span className="font-bold text-base tabular-nums text-foreground text-center">
                {s.points}
              </span>
      <span className="text-[8px] text-center text-gray-600 font-semibold">PTS</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
