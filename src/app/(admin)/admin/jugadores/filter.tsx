"use client"

import { useRouter } from "next/navigation"
import type { Team } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PlayerTeamFilterProps {
  teams: Team[]
  currentTeam?: string
}

export function PlayerTeamFilter({ teams, currentTeam }: PlayerTeamFilterProps) {
  const router = useRouter()

  const handleChange = (value: string | null) => {
    if (value === "all") {
      router.push("/admin/jugadores")
    } else {
      router.push(`/admin/jugadores?team=${value}`)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Filtrar por equipo:</span>
      <Select
        value={currentTeam ?? "all"}
        onValueChange={handleChange}
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Todos los equipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los equipos</SelectItem>
          {teams.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
