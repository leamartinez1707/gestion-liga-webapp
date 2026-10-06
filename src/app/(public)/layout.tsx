import { Suspense } from "react"
import { getSeriesOptions } from "@/lib/db/series"
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
  const seriesOptions = await getSeriesOptions()

  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <Header seriesOptions={seriesOptions} />
      </Suspense>
      {children}
    </>
  )
}
