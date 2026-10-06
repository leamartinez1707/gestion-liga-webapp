import { Suspense } from "react"
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { getArticlesPaginated } from "@/lib/db/news"
import { getSeries } from "@/lib/db/series"
import { ListFilters } from "@/components/admin/list-filters"
import { getMatchOptions } from "@/lib/db/match-options"
import { createArticleAction, updateArticleAction, deleteArticleAction, publishArticleFormAction, unpublishArticleFormAction } from "@/lib/actions/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArticleDialog } from "./dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"

const LIMIT = 10

interface Props { searchParams: Promise<{ page?: string; q?: string; serie?: string; estado?: string }> }

export default async function NoticiasPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1") || 1)
  const [{ data: articles, error, total, totalPages }, { data: seriesList }, matches] = await Promise.all([
    getArticlesPaginated(page, LIMIT, {
      q: params.q,
      seriesId: params.serie,
      published: params.estado === "publicadas" ? true : params.estado === "borradores" ? false : undefined,
    }),
    getSeries(),
    getMatchOptions(),
  ])
  const series = seriesList ?? []
  const filtering = !!(params.q || params.serie || params.estado)

  if (error) return <div className="py-20 text-center"><p className="text-destructive text-sm">{error}</p></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Noticias</h1><p className="mt-1 text-sm text-muted-foreground">Gestioná las noticias de la liga</p></div>
        <ArticleDialog action={createArticleAction} series={series} matches={matches}>
          <Button className="gap-1.5"><Plus className="h-4 w-4" />Nueva Noticia</Button>
        </ArticleDialog>
      </div>
      <Suspense>
        <ListFilters
          searchPlaceholder="Buscar noticia por título"
          selects={[
            { param: "serie", allLabel: "Todas las series", options: [{ value: "general", label: "General (toda la liga)" }, ...series.map((s) => ({ value: s.id, label: s.name }))] },
            { param: "estado", allLabel: "Publicadas y borradores", options: [{ value: "publicadas", label: "Publicadas" }, { value: "borradores", label: "Borradores" }] },
          ]}
          resultLabel={`${total} ${total === 1 ? "noticia" : "noticias"}`}
        />
      </Suspense>
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Serie</TableHead><TableHead>Categoría</TableHead><TableHead>Fecha</TableHead><TableHead className="w-24 text-center">Estado</TableHead><TableHead className="w-28 text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {articles.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">{filtering ? "Ninguna noticia coincide con la búsqueda." : "No hay noticias."}</TableCell></TableRow>}
            {articles.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="max-w-xs"><p className="truncate font-medium">{a.title}</p></TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{series.find((s) => s.id === a.seriesId)?.name ?? "General"}</span></TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{a.category ?? "General"}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{a.date ? new Date(a.date + "T12:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }) : "—"}</TableCell>
                <TableCell className="text-center"><Badge variant={a.published ? "default" : "secondary"} className="text-xs">{a.published ? "Publicada" : "Borrador"}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <form action={a.published ? unpublishArticleFormAction : publishArticleFormAction}><input type="hidden" name="id" value={a.id} /><Button variant="ghost" size="icon-sm">{a.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></form>
                    <ArticleDialog action={updateArticleAction.bind(null, a.id)} article={a} series={series} matches={matches}><Button variant="ghost" size="icon-sm"><Pencil className="h-4 w-4" /></Button></ArticleDialog>
                    <DeleteConfirmDialog itemName={a.title} onConfirm={deleteArticleAction.bind(null, a.id)}><Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></DeleteConfirmDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Suspense><Pagination page={page} totalPages={totalPages} /></Suspense>
    </div>
  )
}
