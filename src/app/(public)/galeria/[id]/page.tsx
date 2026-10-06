import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getAlbum, getPhotos } from "@/lib/db/gallery"
import { Button } from "@/components/ui/button"
import { PhotoViewer } from "./photo-viewer"
import { PageHeader } from "@/components/page-header"

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
    <>
      <PageHeader
        eyebrow="Fotos"
        title={album.title}
        subtitle={`${formatDate(album.date)}${album.date ? " · " : ""}${album.photoCount} ${album.photoCount === 1 ? "foto" : "fotos"}`}
      />
      <div className="page-container py-6 md:py-8">
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" render={<Link href="/galeria" />}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Todas las fotos
      </Button>
      {album.description && <p className="mb-6 max-w-2xl text-sm text-foreground/80">{album.description}</p>}

      <div>
        {(photos ?? []).length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">Este álbum no tiene fotos todavía.</p>
        ) : (
          <PhotoViewer photos={photos ?? []} title={album.title} />
        )}
      </div>
      </div>
    </>
  )
}
