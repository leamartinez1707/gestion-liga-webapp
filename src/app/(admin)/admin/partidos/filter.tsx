"use client"

import { useRouter } from "next/navigation"
import type { Tournament } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MatchFilterProps {
  tournaments: Tournament[]
  currentTournament?: string
}

export function MatchFilter({
  tournaments,
  currentTournament,
}: MatchFilterProps) {
  const router = useRouter()

  const handleFilter = (value: string | null) => {
    if (value && value !== "all") {
      router.push(`/admin/partidos?tournament=${value}`)
    } else {
      router.push("/admin/partidos")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Filtrar por torneo:</span>
      <Select
        value={currentTournament ?? "all"}
        onValueChange={handleFilter}
      >
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Todos los torneos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los torneos</SelectItem>
          {tournaments.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name} — {t.category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
