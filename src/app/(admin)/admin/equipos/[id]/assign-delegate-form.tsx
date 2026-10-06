"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import { assignDelegateAction } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" size="sm" variant="outline" disabled={pending}>{pending ? "Asignando…" : "Asignar"}</Button>
}

/** Assign an existing delegate account (by email) to this team. */
export function AssignDelegateForm({ teamId }: { teamId: string }) {
  const [state, formAction] = useActionState(assignDelegateAction.bind(null, teamId), undefined)
  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Input name="email" type="email" required placeholder="O asigná una cuenta de delegado que ya existe (email)" className="flex-1" />
        <SubmitButton />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  )
}
