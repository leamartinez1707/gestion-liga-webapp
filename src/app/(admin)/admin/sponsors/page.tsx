import { Plus, Pencil, Trash2 } from "lucide-react"
import { getSponsors } from "@/lib/db/sponsors"
import { createSponsorAction, updateSponsorAction, deleteSponsorAction } from "@/lib/actions/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { SponsorDialog } from "./dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"

export default async function SponsorsPage() {
  const { data: sponsors, error } = await getSponsors()
  if (error) return <div className="py-20 text-center"><p className="text-destructive text-sm">{error}</p></div>
  const list = sponsors ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Sponsors</h1><p className="mt-1 text-sm text-muted-foreground">Gestioná los auspiciantes de la liga</p></div>
        <SponsorDialog action={createSponsorAction}>
          <Button className="gap-1.5"><Plus className="h-4 w-4" />Nuevo Sponsor</Button>
        </SponsorDialog>
      </div>
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Logo</TableHead><TableHead>Nombre</TableHead><TableHead>Link</TableHead><TableHead>Orden</TableHead><TableHead className="w-24 text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No hay sponsors.</TableCell></TableRow>}
            {list.map((s) => (
              <TableRow key={s.id}>
                <TableCell><img src={s.logoUrl} alt={s.name} className="h-8 w-auto object-contain" /></TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs truncate max-w-[200px]">{s.linkUrl || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{s.displayOrder}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <SponsorDialog action={updateSponsorAction.bind(null, s.id)} sponsor={s}><Button variant="ghost" size="icon-sm"><Pencil className="h-4 w-4" /></Button></SponsorDialog>
                    <DeleteConfirmDialog itemName={s.name} onConfirm={deleteSponsorAction.bind(null, s.id)}><Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></DeleteConfirmDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
