"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Trophy,
  Users,
  UserRound,
  Calendar,
  Ban,
  Newspaper,
  Layers,
  HeartHandshake,
  LogOut,
  Menu,
} from "lucide-react"

import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const sidebarLinks = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Series", href: "/admin/series", icon: Layers },
  { label: "Torneos", href: "/admin/torneos", icon: Trophy },
  { label: "Equipos", href: "/admin/equipos", icon: Users },
  { label: "Jugadores", href: "/admin/jugadores", icon: UserRound },
  { label: "Partidos", href: "/admin/partidos", icon: Calendar },
  { label: "Sanciones", href: "/admin/sanciones", icon: Ban },
  { label: "Noticias", href: "/admin/noticias", icon: Newspaper },
  { label: "Sponsors", href: "/admin/sponsors", icon: HeartHandshake },
]

// ---------------------------------------------------------------------------
// Sidebar nav (desktop and mobile)
// ---------------------------------------------------------------------------
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {sidebarLinks.map((link) => {
        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href)

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <link.icon className="h-4 w-4 shrink-0" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Desktop sidebar
// ---------------------------------------------------------------------------
export function AdminDesktopSidebar({ userEmail }: { userEmail?: string }) {
  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-border">
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          LM
        </div>
        <span className="text-sm font-semibold text-foreground">Admin</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarContent />
      </div>
      <div className="border-t border-border p-3">
        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Mobile sidebar (Sheet)
// ---------------------------------------------------------------------------
export function AdminMobileSidebar({
  userEmail,
}: {
  userEmail?: string
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-56 p-4">
        <SheetTitle className="sr-only">Navegación</SheetTitle>
        <div className="flex items-center gap-2 border-b border-border pb-4 mb-4">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            LM
          </div>
          <span className="text-sm font-semibold text-foreground">Admin</span>
        </div>
        <SidebarContent onNavigate={() => {}} />
        <div className="border-t border-border mt-4 pt-4">
          <form action={signOut}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}


