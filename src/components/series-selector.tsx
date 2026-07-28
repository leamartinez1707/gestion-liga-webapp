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
      {/* Series tabs — big and prominent */}
      <div className="flex flex-wrap gap-1.5">
        {series.map((s) => {
          const isActive = selectedSeries === s.id
          return (
            <button
              key={s.id}
              onClick={() => onSeriesChange(s.id)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                isActive
                  ? "bg-white text-primary shadow-sm"
                  : "bg-white/10 text-primary-foreground/80 hover:bg-white/20 hover:text-white"
              )}
            >
              {s.name}
            </button>
          )
        })}
      </div>

      {/* Division tabs — pills */}
      {divisions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {divisions.map((d) => (
            <button
              key={d.id}
              onClick={() => onDivisionChange(d.id)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                selectedDivision === d.id
                  ? "bg-white/25 text-white"
                  : "text-primary-foreground/60 hover:text-primary-foreground/90 hover:bg-white/10"
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
