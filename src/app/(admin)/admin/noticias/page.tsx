import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"

import { getArticles } from "@/lib/db/news"
import {
  createArticleAction,
  updateArticleAction,
  deleteArticleAction,
  publishArticleFormAction,
  unpublishArticleFormAction,
} from "@/lib/actions/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArticleDialog } from "./dialog"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"

export default async function NoticiasPage() {
  const articles = await getArticles()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Noticias
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná las noticias de la liga
          </p>
        </div>
        <ArticleDialog action={createArticleAction}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nueva Noticia
          </Button>
        </ArticleDialog>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-24 text-center">Estado</TableHead>
              <TableHead className="w-28 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No hay noticias todavía. Creá la primera.
                </TableCell>
              </TableRow>
            )}
            {articles.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="max-w-xs">
                  <p className="truncate font-medium">{a.title}</p>
                  {a.excerpt && (
                    <p className="truncate text-xs text-muted-foreground">
                      {a.excerpt}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {a.category ?? "General"}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {a.date
                    ? new Date(a.date + "T12:00:00").toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={a.published ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {a.published ? "Publicada" : "Borrador"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Publish / Unpublish */}
                    <form
                      action={
                        a.published
                          ? unpublishArticleFormAction
                          : publishArticleFormAction
                      }
                    >
                      <input type="hidden" name="id" value={a.id} />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={a.published ? "Despublicar" : "Publicar"}
                        title={a.published ? "Despublicar" : "Publicar"}
                      >
                        {a.published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </form>

                    <ArticleDialog
                      action={updateArticleAction.bind(null, a.id)}
                      article={a}
                    >
                      <Button variant="ghost" size="icon-sm" aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </ArticleDialog>

                    <DeleteConfirmDialog
                      itemName={a.title}
                      onConfirm={deleteArticleAction.bind(null, a.id)}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Eliminar"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DeleteConfirmDialog>
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
