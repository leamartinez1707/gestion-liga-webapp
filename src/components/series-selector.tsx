"use client"

import { cn } from "@/lib/utils"

export interface SeriesOption {
  id: string
  name: string
  slug: string
  divisions: DivisionOption[]
}

export interface DivisionOption {
  id: string
  name: string
}

interface SeriesSelectorProps {
  series: SeriesOption[]
  selectedSeries: string
  selectedDivision: string
  onSeriesChange: (seriesId: string) => void
  onDivisionChange: (divisionId: string) => void
}

export function SeriesSelector({
  series,
  selectedSeries,
  selectedDivision,
  onSeriesChange,
  onDivisionChange,
}: SeriesSelectorProps) {
  const currentSeries = series.find((s) => s.id === selectedSeries)
  const divisions = currentSeries?.divisions ?? []

  return (
    <div className="space-y-3">
      {/* Series tabs */}
      <div className="flex flex-wrap gap-1">
        {series.map((s) => (
          <button
            key={s.id}
            onClick={() => onSeriesChange(s.id)}
            className={cn(
              "px-4 py-1.5 rounded text-sm font-medium transition-colors",
              selectedSeries === s.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted-bg text-muted-foreground hover:text-foreground hover:bg-border"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Division tabs */}
      {divisions.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {divisions.map((d) => (
            <button
              key={d.id}
              onClick={() => onDivisionChange(d.id)}
              className={cn(
                "px-3 py-0.5 rounded text-xs font-medium transition-colors",
                selectedDivision === d.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
