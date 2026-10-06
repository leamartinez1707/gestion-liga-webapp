import { Trash2 } from "lucide-react"

import { getReferees } from "@/lib/db/referees"
import { removeRefereeAction } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { AddRefereeForm } from "./add-referee-form"

export default async function ArbitrosPage() {
  const referees = await getReferees()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Árbitros</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cargan goles y tarjetas desde el celular en los partidos que les asignes.
        </p>
      </div>

      <div className="rounded-xl border border-border p-5 flex flex-col gap-3">
        <h2 className="font-semibold">Agregar árbitro</h2>
        <p className="text-sm text-muted-foreground">
          La persona tiene que tener una cuenta creada (Supabase → Authentication → Add user). Después escribí acá su email.
          Entra por <span className="font-mono">/login</span> y ve sus partidos en <span className="font-mono">/arbitro</span>.
        </p>
        <AddRefereeForm />
      </div>

      <div className="rounded-xl border border-border divide-y divide-border">
        {referees.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Todavía no hay árbitros.</p>
        ) : (
          referees.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">{r.email}</span>
              <DeleteConfirmDialog
                itemName={r.email}
                title="Quitar árbitro"
                description={`${r.email} deja de ser árbitro y ya no puede cargar partidos.`}
                confirmLabel="Quitar"
                pendingLabel="Quitando…"
                onConfirm={removeRefereeAction.bind(null, r.email)}
              >
                <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Quitar árbitro">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DeleteConfirmDialog>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
