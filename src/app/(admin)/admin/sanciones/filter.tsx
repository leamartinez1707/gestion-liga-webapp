"use client"

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SanctionsFilterProps {
  currentStatus?: string
}

export function SanctionsFilter({
  currentStatus,
}: SanctionsFilterProps) {
  const router = useRouter()

  const handleFilter = (value: string | null) => {
    if (value && value !== "all") {
      router.push(`/admin/sanciones?status=${value}`)
    } else {
      router.push("/admin/sanciones")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Estado:</span>
      <Select
        value={currentStatus ?? "all"}
        onValueChange={handleFilter}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Todas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="active">Activas</SelectItem>
          <SelectItem value="completed">Cumplidas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
