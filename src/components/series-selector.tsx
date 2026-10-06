"use client"

import { cn } from "@/lib/utils"
import { resolveScope, type SeriesOption } from "@/lib/scope"

export type { SeriesOption, DivisionOption } from "@/lib/scope"

interface SeriesSelectorProps {
  series: SeriesOption[]
  selectedSeries: string
  selectedDivision: string
  onSeriesChange: (seriesSlug: string) => void
  onDivisionChange: (divSlug: string) => void
}

export function SeriesSelector({ series, selectedSeries, selectedDivision, onSeriesChange, onDivisionChange }: SeriesSelectorProps) {
  // Same fallback as the pages: first series / first division when not in the URL
  const scope = resolveScope(series, selectedSeries, selectedDivision)
  const divisions = scope.series?.divisions ?? []

  return (
    <div className="space-y-2">
      {/* Series tabs */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Serie">
        {series.map((s) => {
          const isActive = scope.series?.id === s.id
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSeriesChange(s.slug)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all border",
                isActive
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
              )}
            >
              {s.name}
            </button>
          )
        })}
      </div>

      {/* Division pills */}
      {divisions.length > 0 && (
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="División">
          {divisions.map((d) => {
            const isActive = scope.division?.id === d.id
            return (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onDivisionChange(d.slug)}
                className={cn(
                  "min-h-8 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted-bg hover:text-foreground"
                )}
              >
                {d.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
