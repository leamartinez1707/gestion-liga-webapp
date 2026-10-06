import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getAlbum, getPhotos } from "@/lib/db/gallery"
import { Button } from "@/components/ui/button"
import { PhotoViewer } from "./photo-viewer"

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Unpublished albums are invisible to visitors (RLS) → 404
  const { data: album } = await getAlbum(id)
  if (!album) notFound()
  const { data: photos } = await getPhotos(id)

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <Button variant="ghost" size="sm" className="mb-6" render={<Link href="/galeria" />}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Todas las fotos
      </Button>

      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{album.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(album.date)}{album.date && " · "}{album.photoCount} {album.photoCount === 1 ? "foto" : "fotos"}
      </p>
      {album.description && <p className="mt-3 max-w-2xl text-sm text-foreground/80">{album.description}</p>}

      <div className="mt-8">
        {(photos ?? []).length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">Este álbum no tiene fotos todavía.</p>
        ) : (
          <PhotoViewer photos={photos ?? []} title={album.title} />
        )}
      </div>
    </div>
  )
}
