"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import type { LeagueSettings } from "@/lib/types"
import { updateSettingsAction } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</Button>
}

export function SettingsForm({ settings }: { settings: LeagueSettings }) {
  const [state, formAction] = useActionState(updateSettingsAction, undefined)

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-5">
      <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">🟨 Amarillas</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="yellowCardsForSuspension">Amarillas para suspender</Label>
            <Input id="yellowCardsForSuspension" name="yellowCardsForSuspension" type="number" min={0} max={50}
              defaultValue={settings.yellowCardsForSuspension} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="yellowSuspensionMatches">Fechas de suspensión</Label>
            <Input id="yellowSuspensionMatches" name="yellowSuspensionMatches" type="number" min={0} max={50}
              defaultValue={settings.yellowSuspensionMatches} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Se cuentan por torneo. Por ejemplo 5 y 1: cada 5 amarillas el jugador se pierde 1 fecha. Con 0 amarillas no se suspende por acumulación.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">🟥 Rojas</legend>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="redCardMatches">Fechas de suspensión por roja</Label>
          <Input id="redCardMatches" name="redCardMatches" type="number" min={0} max={50} defaultValue={settings.redCardMatches} className="max-w-32" />
        </div>
        <p className="text-xs text-muted-foreground">
          Es lo que se aplica automáticamente. Si el tribunal da más fechas, editá la sanción en Sanciones.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">🟦 Azules (fútbol sala)</legend>
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" name="blueCardsEnabled" defaultChecked={settings.blueCardsEnabled} className="mt-0.5 size-4 accent-primary" />
          <span>
            <span className="font-medium">Usar tarjeta azul</span>
            <span className="block text-xs text-muted-foreground">
              El árbitro la ve en la planilla. El jugador sale del partido, pero no queda suspendido para la fecha siguiente.
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">👕 Refuerzos</legend>
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" name="guestPlayersAllowed" defaultChecked={settings.guestPlayersAllowed} className="mt-0.5 size-4 accent-primary" />
          <span>
            <span className="font-medium">Permitir refuerzos</span>
            <span className="block text-xs text-muted-foreground">
              Jugadores que no están en la lista de buena fe del torneo y se fichan para algunos partidos. Si no se permiten, solo juegan los de la lista.
            </span>
          </span>
        </label>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="guestPlayerMaxMatches">Partidos que puede jugar cada refuerzo por torneo</Label>
          <Input id="guestPlayerMaxMatches" name="guestPlayerMaxMatches" type="number" min={0} max={50}
            defaultValue={settings.guestPlayerMaxMatches} className="max-w-32" />
          <p className="text-xs text-muted-foreground">0 = sin límite.</p>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">📝 Planilla del árbitro</legend>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="refereeEditDays">Días que el árbitro puede corregir un partido terminado</Label>
          <Input id="refereeEditDays" name="refereeEditDays" type="number" min={0} max={365} placeholder="Sin límite"
            defaultValue={settings.refereeEditDays ?? ""} className="max-w-32" />
          <p className="text-xs text-muted-foreground">
            Vacío = sin límite. 0 = solo el mismo día del partido. Pasado el plazo solo un administrador puede editarlo.
          </p>
        </div>
      </fieldset>

      <p className="text-xs text-muted-foreground">
        Los cambios se aplican a las tarjetas que se carguen desde ahora.
      </p>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">Configuración guardada.</p>}
      <div><SubmitButton /></div>
    </form>
  )
}
