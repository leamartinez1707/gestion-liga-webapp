import { getLeagueSettings } from "@/lib/db/settings"
import { SettingsForm } from "./settings-form"

export default async function ConfiguracionPage() {
  const settings = await getLeagueSettings()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración de la liga</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reglas de sanciones que se aplican automáticamente</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  )
}
