"use client"

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SeasonFilterProps {
  seasons: string[]
  current: string
}

/** Season of the matches page: the list and the dialogs only load that season's data. */
export function SeasonFilter({ seasons, current }: SeasonFilterProps) {
  const router = useRouter()

  if (seasons.length <= 1) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Temporada:</span>
      <Select
        value={current}
        onValueChange={(value: string | null) => {
          // Back to page 1 of the new season
          if (value) router.push(`/admin/partidos?temporada=${encodeURIComponent(value)}`)
        }}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {seasons.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
