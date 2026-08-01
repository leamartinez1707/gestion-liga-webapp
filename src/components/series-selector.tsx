"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
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
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

interface SeriesSelectorProps {
  series: SeriesOption[]
  selectedSeries: string
  selectedDivision: string
  onSeriesChange: (seriesSlug: string) => void
  onDivisionChange: (divSlug: string) => void
}

export function SeriesSelector({
  series,
  selectedSeries,
  selectedDivision,
  onSeriesChange,
  onDivisionChange,
}: SeriesSelectorProps) {
  const currentSeries = series.find((s) => s.slug === selectedSeries || s.id === selectedSeries)
  const divisions = currentSeries?.divisions ?? []

  return (
    <div className="space-y-3">
      {/* Series tabs — big and prominent */}
      <div className="flex flex-wrap gap-1.5">
        {series.map((s) => {
          const isActive = selectedSeries === s.slug || selectedSeries === s.id
          return (
            <button
              key={s.id}
              onClick={() => onSeriesChange(s.slug)}
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
          {divisions.map((d) => {
            const slug = toDivSlug(d.name)
            const isActive = selectedDivision === slug || selectedDivision === d.id
            return (
              <button
                key={d.id}
                onClick={() => onDivisionChange(slug)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-colors",
                  isActive
                    ? "bg-white/25 text-white"
                    : "text-primary-foreground/60 hover:text-primary-foreground/90 hover:bg-white/10"
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
