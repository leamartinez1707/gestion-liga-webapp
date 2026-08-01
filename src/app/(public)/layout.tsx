import { Suspense } from "react"
import { getSeries, getDivisions } from "@/lib/db/series"
import type { SeriesOption } from "@/components/series-selector"
import { Header } from "@/components/layout/header"

function HeaderFallback() {
  return (
    <div className="h-[140px] bg-primary animate-pulse" />
  )
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [{ data: seriesList }, { data: divisionsList }] = await Promise.all([
    getSeries(),
    getDivisions(),
  ])

  const series = seriesList ?? []
  const divisions = divisionsList ?? []

  const seriesOptions: SeriesOption[] = series.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    divisions: divisions
      .filter((d) => d.seriesId === s.id)
      .map((d) => ({ id: d.id, name: d.name })),
  }))

  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <Header seriesOptions={seriesOptions} />
      </Suspense>
      {children}
    </>
  )
}
