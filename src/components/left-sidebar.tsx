import Link from "next/link"
import { Trophy, Goal, MapPin, ClipboardCheck, FileText, Shield } from "lucide-react"

const links = [
  { href: "/partidos", label: "Posiciones", icon: Trophy },
  { href: "/partidos?tab=goleadores", label: "Goleadores", icon: Goal },
  { href: "/institucional#complejos", label: "Complejos", icon: MapPin },
  { href: "/institucional#inscripcion", label: "Inscripción", icon: ClipboardCheck },
  { href: "/institucional#reglamento", label: "Reglamento", icon: FileText },
]

export function LeftSidebar() {
  return (
    <aside className="space-y-6">
      {/* Quick links */}
      <nav className="space-y-0.5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted-bg transition-colors"
          >
            <link.icon className="h-4 w-4 shrink-0 text-primary" />
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Sponsors */}
      <div className="space-y-3 pt-4 border-t border-border">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Auspiciantes
        </p>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-center h-16 rounded-lg border border-dashed border-border bg-muted-bg text-[10px] text-muted-foreground"
            >
              <Shield className="h-4 w-4 mr-1.5" />
              Logo {i}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
