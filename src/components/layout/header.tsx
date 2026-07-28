"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { navLinks } from "@/components/layout/nav-links"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-white/20 text-sm font-bold">
            LM
          </span>
          <span className="hidden sm:inline">Liga Metropolitana</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-primary-foreground/80 hover:text-white hover:bg-white/10"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger className="md:hidden" render={<Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" aria-label="Abrir menú" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="bg-primary text-primary-foreground border-primary/20">
            <SheetTitle className="sr-only">Navegación</SheetTitle>
            <div className="flex flex-col gap-1 mt-8">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3 py-2 rounded text-base font-medium transition-colors",
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-primary-foreground/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
