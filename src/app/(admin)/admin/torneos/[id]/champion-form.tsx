"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="shrink-0 gap-1.5">
      <Trophy className="h-4 w-4" />
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  )
}

interface Props {
  /** Registered teams */
  teams: { id: string; name: string }[]
  championId?: string
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

/** Pick the tournament's champion: it counts as a title ("copa") on the team page. */
export function ChampionForm({ teams, championId, action }: Props) {
  const [state, formAction] = useActionState(action, undefined)
  const [teamId, setTeamId] = useState(championId ?? "none")

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Select value={teamId} onValueChange={(v) => v && setTeamId(v)} name="teamId">
          <SelectTrigger className="w-full max-w-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin campeón todavía</SelectItem>
            {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <SubmitButton />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">Guardado.</p>}
    </form>
  )
}
