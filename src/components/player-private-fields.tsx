import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** Cédula and phone of a player: private, never shown on the public site. */
export function PlayerPrivateFields({ document = "", phone = "", idPrefix = "player" }: { document?: string; phone?: string; idPrefix?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-document`}>Cédula</Label>
          <Input id={`${idPrefix}-document`} name="document" inputMode="numeric" maxLength={20} defaultValue={document} placeholder="Sin puntos ni guion" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-phone`}>Teléfono</Label>
          <Input id={`${idPrefix}-phone`} name="phone" type="tel" maxLength={25} defaultValue={phone} placeholder="Ej: 099 123 456" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Privados: los ven la liga, los delegados del equipo y los árbitros. No salen en la web.</p>
    </div>
  )
}
