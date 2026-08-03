"use client"

import { useCallback, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Menu, Lock } from "lucide-react"

import type { SeriesOption } from "@/components/series-selector"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SeriesSelector } from "@/components/series-selector"
import { navLinks } from "@/components/layout/nav-links"
import { cn } from "@/lib/utils"

interface HeaderProps {
  seriesOptions: SeriesOption[]
}

export function Header({ seriesOptions }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const paramSerie = searchParams.get("serie") ?? ""
  const paramDiv = searchParams.get("div") ?? ""

  // Auto-select first series if none selected
  useEffect(() => {
    if (!paramSerie && seriesOptions.length > 0 && pathname !== "/institucional") {
      const first = seriesOptions[0]
      const params = new URLSearchParams(searchParams.toString())
      params.set("serie", first.slug)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [paramSerie, seriesOptions, pathname, router, searchParams])

  const handleSeriesChange = useCallback(
    (seriesSlug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("serie", seriesSlug)
      params.delete("div")
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, pathname]
  )

  const handleDivisionChange = useCallback(
    (divSlug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("div", divSlug)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, pathname]
  )

  const isHome = pathname === "/"

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Green bar with logo + nav */}
      <div className="w-full bg-[#0d4a2a] border-b-2 border-white/20">
        <div className="flex h-12 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center h-7 w-7 rounded bg-white text-[#0d4a2a] text-[10px] font-black">
              LM
            </div>
            <span className="hidden sm:inline text-white font-black text-sm tracking-tight uppercase">
              Liga Metropolitana
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = link.href === "/" ? isHome : pathname.startsWith(link.href)
              const navHref = paramSerie
                ? `${link.href}?serie=${paramSerie}${paramDiv ? `&div=${paramDiv}` : ""}`
                : link.href
              return (
                <Link
                  key={link.href}
                  href={navHref}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-bold uppercase tracking-wide transition-colors",
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/admin"
              className="ml-2 px-2 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Panel de administración"
            >
              <Lock className="h-3 w-3" />
            </Link>
          </nav>

          {/* Mobile */}
          <Sheet>
            <SheetTrigger className="md:hidden" render={<Button variant="ghost" size="icon" className="text-white hover:bg-white/10 shrink-0" aria-label="Abrir menú" />}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#0d4a2a] text-white border-white/10">
              <SheetTitle className="sr-only">Navegación</SheetTitle>
              <div className="flex flex-col gap-1 mt-8">
                {navLinks.map((link) => {
                  const isActive = link.href === "/" ? isHome : pathname.startsWith(link.href)
                  const navHref = paramSerie
                    ? `${link.href}?serie=${paramSerie}${paramDiv ? `&div=${paramDiv}` : ""}`
                    : link.href
                  return (
                    <Link key={link.href} href={navHref} className={cn("px-3 py-2 rounded text-base font-medium", isActive ? "bg-white/20" : "text-white/70 hover:bg-white/10")}>
                      {link.label}
                    </Link>
                  )
                })}
              </div>
              <div className="border-t border-white/10 mt-4 pt-4">
                <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded text-base text-white/50 hover:text-white">
                  <Lock className="h-4 w-4" /> Panel
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Series selector bar — white background, green accents */}
      {seriesOptions.length > 0 && (
        <div className="w-full bg-white border-b border-border shadow-sm">
          <div className="px-4 py-2">
            <SeriesSelector
              series={seriesOptions}
              selectedSeries={paramSerie}
              selectedDivision={paramDiv}
              onSeriesChange={handleSeriesChange}
              onDivisionChange={handleDivisionChange}
            />
          </div>
        </div>
      )}
    </header>
  )
}
