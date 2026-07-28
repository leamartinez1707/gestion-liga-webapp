"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import type { Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar cambios"}
    </Button>
  )
}

interface TeamEditFormProps {
  team: Team
  action: (
    prev: unknown,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean }>
}

export function TeamEditForm({ team, action }: TeamEditFormProps) {
  const [state, formAction] = useActionState(action, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          defaultValue={team.name}
          placeholder="Nombre del equipo"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shortName">Nombre corto</Label>
        <Input
          id="shortName"
          name="shortName"
          defaultValue={team.shortName}
          placeholder="Ej: Pumas"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Categoría</Label>
        <Input
          id="category"
          name="category"
          defaultValue={team.category}
          placeholder="Ej: Primera División"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="coach">Director Técnico</Label>
        <Input
          id="coach"
          name="coach"
          defaultValue={team.coach ?? ""}
          placeholder="Nombre del DT"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assistantCoach">Ayudante de campo</Label>
        <Input
          id="assistantCoach"
          name="assistantCoach"
          defaultValue={team.assistantCoach ?? ""}
          placeholder="Nombre del asistente"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      {state?.success && (
        <p className="text-sm text-emerald-600">Cambios guardados.</p>
      )}

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  )
}
