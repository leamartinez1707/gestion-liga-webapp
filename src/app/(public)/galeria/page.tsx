import { getAlbums } from "@/lib/db/gallery"
import { getSeriesOptions } from "@/lib/db/series"
import { resolveScope } from "@/lib/scope"
import { AlbumCard } from "@/components/album-card"
import { PageHeader } from "@/components/page-header"

interface Props { searchParams: Promise<{ serie?: string; div?: string }> }

export default async function GaleriaPage({ searchParams }: Props) {
  const params = await searchParams
  const [{ data: albums, error }, seriesOptions] = await Promise.all([getAlbums(), getSeriesOptions()])
  const { series } = resolveScope(seriesOptions, params.serie, params.div)

  // Albums of the selected series plus league-wide ones, with at least one photo
  const list = (albums ?? []).filter(
    (a) => a.photoCount > 0 && (!series || !a.seriesId || a.seriesId === series.id)
  )

  return (
    <>
      <PageHeader eyebrow={series?.name} title="Fotos" subtitle="Buscate en las fotos de cada fecha" />
      <div className="page-container py-8 md:py-10">

      {error && <p className="text-center text-destructive text-sm">{error}</p>}

      {!error && list.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Todavía no hay fotos publicadas.</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {list.map((a) => <AlbumCard key={a.id} album={a} />)}
        </div>
      )}
      </div>
    </>
  )
}
