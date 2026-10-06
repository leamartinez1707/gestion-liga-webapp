"use client"

import { useState } from "react"

import type { SeriesOption } from "@/lib/scope"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SeriesDivisionFieldsProps {
  series: SeriesOption[]
  defaultSeriesId?: string
  defaultDivisionId?: string
}

/** Serie + División selects for admin forms (posts seriesId and divisionId). */
export function SeriesDivisionFields({
  series,
  defaultSeriesId,
  defaultDivisionId,
}: SeriesDivisionFieldsProps) {
  const [seriesId, setSeriesId] = useState(defaultSeriesId ?? series[0]?.id ?? "")
  const [divisionId, setDivisionId] = useState(defaultDivisionId ?? "")

  const divisions = series.find((s) => s.id === seriesId)?.divisions ?? []
  const seriesItems = series.map((s) => ({ value: s.id, label: s.name }))
  const divisionItems = divisions.map((d) => ({ value: d.id, label: d.name }))

  if (series.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Primero creá una serie con sus divisiones en la sección Series.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Serie</Label>
        <Select
          items={seriesItems}
          value={seriesId}
          onValueChange={(v) => {
            if (!v || v === seriesId) return
            setSeriesId(v)
            setDivisionId("")
          }}
          name="seriesId"
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Elegí una serie" />
          </SelectTrigger>
          <SelectContent>
            {seriesItems.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>División</Label>
        <Select
          items={divisionItems}
          value={divisionId}
          onValueChange={(v) => v && setDivisionId(v)}
          name="divisionId"
          disabled={divisionItems.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={divisionItems.length ? "Elegí una división" : "Sin divisiones"} />
          </SelectTrigger>
          <SelectContent>
            {divisionItems.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
