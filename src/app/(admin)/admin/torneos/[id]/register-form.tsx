"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Plus } from "lucide-react"

import type { Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={disabled || pending} className="gap-1.5 shrink-0">
      <Plus className="h-4 w-4" />
      {pending ? "Inscribiendo…" : "Inscribir"}
    </Button>
  )
}

interface RegisterFormProps {
  /** Teams not yet entered in this tournament */
  teams: Team[]
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

export function RegisterForm({ teams, action }: RegisterFormProps) {
  const [state, formAction] = useActionState(action, undefined)
  const [teamId, setTeamId] = useState("")
  const items = teams.map((t) => ({ value: t.id, label: t.name }))

  // After registering, the team leaves the list: clear the selection
  if (teamId && !items.some((t) => t.value === teamId)) setTeamId("")

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Select items={items} value={teamId} onValueChange={(v) => v && setTeamId(v)} name="teamId">
          <SelectTrigger className="w-full max-w-sm">
            <SelectValue placeholder={items.length ? "Elegí un equipo" : "Todos los equipos están inscriptos"} />
          </SelectTrigger>
          <SelectContent>
            {items.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SubmitButton disabled={!teamId} />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  )
}
