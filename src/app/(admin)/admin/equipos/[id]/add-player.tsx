"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Plus, Camera } from "lucide-react"

import { createPlayerAction } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const positions = [
  { value: "arquero", label: "Arquero" },
  { value: "defensa", label: "Defensa" },
  { value: "mediocampista", label: "Mediocampista" },
  { value: "delantero", label: "Delantero" },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending} className="gap-1">
      <Plus className="h-3.5 w-3.5" />
      {pending ? "Agregando…" : "Agregar"}
    </Button>
  )
}

interface AddPlayerInlineProps {
  teamId: string
}

export function AddPlayerInline({ teamId }: AddPlayerInlineProps) {
  const action = createPlayerAction
  const [state, formAction] = useActionState(action, undefined)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="teamId" value={teamId} />

      <div className="flex flex-col gap-1">
        <Label htmlFor="name" className="text-xs">
          Nombre
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Nombre del jugador"
          className="h-8 w-48"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="number" className="text-xs">
          N°
        </Label>
        <Input
          id="number"
          name="number"
          type="number"
          placeholder="1"
          className="h-8 w-16"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="position" className="text-xs">
          Posición
        </Label>
        <Select name="position" defaultValue="delantero">
          <SelectTrigger className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {positions.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Photo (compact) */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="photo" className="text-xs cursor-pointer">
          <Camera className="h-3.5 w-3.5 inline mr-0.5" />
          Foto
        </Label>
        <Input
          id="photo"
          name="photo"
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="h-8 w-24 text-[10px] file:text-[10px]"
        />
      </div>

      <SubmitButton />

      {state?.error && (
        <p className="w-full text-xs text-destructive">{state.error}</p>
      )}
    </form>
  )
}
