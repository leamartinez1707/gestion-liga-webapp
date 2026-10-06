"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Plus } from "lucide-react"

import { addRefereeAction } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="gap-1.5 shrink-0">
      <Plus className="h-4 w-4" />
      {pending ? "Agregando…" : "Agregar"}
    </Button>
  )
}

export function AddRefereeForm() {
  const [state, formAction] = useActionState(addRefereeAction, undefined)
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input name="email" type="email" placeholder="email@del-arbitro.com" required className="max-w-sm" />
        <SubmitButton />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">Árbitro agregado.</p>}
    </form>
  )
}
