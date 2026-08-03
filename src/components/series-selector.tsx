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

function toDivSlug(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

interface SeriesSelectorProps {
  series: SeriesOption[]
  selectedSeries: string
  selectedDivision: string
  onSeriesChange: (seriesSlug: string) => void
  onDivisionChange: (divSlug: string) => void
}

export function SeriesSelector({ series, selectedSeries, selectedDivision, onSeriesChange, onDivisionChange }: SeriesSelectorProps) {
  const currentSeries = series.find((s) => s.slug === selectedSeries || s.id === selectedSeries)
  const divisions = currentSeries?.divisions ?? []

  return (
    <div className="space-y-2">
      {/* Series tabs */}
      <div className="flex flex-wrap gap-1.5">
        {series.map((s) => {
          const isActive = selectedSeries === s.slug || selectedSeries === s.id
          return (
            <button
              key={s.id}
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
        <div className="flex flex-wrap gap-1">
          {divisions.map((d) => {
            const slug = toDivSlug(d.name)
            const isActive = selectedDivision === slug || selectedDivision === d.id
            return (
              <button
                key={d.id}
                onClick={() => onDivisionChange(slug)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors",
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
