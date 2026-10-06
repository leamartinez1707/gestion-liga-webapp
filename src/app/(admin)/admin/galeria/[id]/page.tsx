import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil, Trash2, ExternalLink } from "lucide-react"

import { getAlbum, getPhotos } from "@/lib/db/gallery"
import { getSeries } from "@/lib/db/series"
import { updateAlbumAction, deleteAlbumAction } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { AlbumDialog } from "../album-dialog"
import { getMatchOptions } from "@/lib/db/match-options"
import { PhotoUploader } from "./photo-uploader"
import { AdminPhotoGrid } from "./photo-grid"

export default async function AlbumAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: album } = await getAlbum(id, true)
  if (!album) notFound()

  const [{ data: photos }, { data: series }, matches] = await Promise.all([
    getPhotos(id, true),
    getSeries(),
    getMatchOptions(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/galeria" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Volver a la galería
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {album.title}
            {!album.published && <Badge variant="secondary">Borrador</Badge>}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {album.date || "Sin fecha"} · {album.photoCount} {album.photoCount === 1 ? "foto" : "fotos"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {album.published && (
            <Button variant="ghost" size="icon-sm" aria-label="Ver en el sitio" render={<Link href={`/galeria/${album.id}`} target="_blank" />}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <AlbumDialog action={updateAlbumAction.bind(null, album.id)} album={album} series={series ?? []} matches={matches}>
            <Button variant="ghost" size="icon-sm" aria-label="Editar álbum"><Pencil className="h-4 w-4" /></Button>
          </AlbumDialog>
          <DeleteConfirmDialog
            itemName={`el álbum "${album.title}" y todas sus fotos`}
            onConfirm={deleteAlbumAction.bind(null, album.id)}
          >
            <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Eliminar álbum"><Trash2 className="h-4 w-4" /></Button>
          </DeleteConfirmDialog>
        </div>
      </div>

      <PhotoUploader albumId={album.id} />
      <AdminPhotoGrid albumId={album.id} photos={photos ?? []} coverUrl={album.coverUrl} />
    </div>
  )
}
