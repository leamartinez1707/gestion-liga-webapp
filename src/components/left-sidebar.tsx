import Link from "next/link"
import { Trophy, Goal, MapPin, ClipboardCheck, FileText } from "lucide-react"
import type { Sponsor } from "@/lib/types"

const links = [
  { href: "/partidos", label: "Posiciones", icon: Trophy },
  { href: "/partidos?tab=goleadores", label: "Goleadores", icon: Goal },
  { href: "/institucional#complejos", label: "Complejos", icon: MapPin },
  { href: "/institucional#inscripcion", label: "Inscripción", icon: ClipboardCheck },
  { href: "/institucional#reglamento", label: "Reglamento", icon: FileText },
]

interface Props {
  sponsors?: Sponsor[]
}

export function LeftSidebar({ sponsors = [] }: Props) {
  return (
    <aside className="space-y-6">
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

      {sponsors.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Auspiciantes
          </p>
          <div className="space-y-2">
            {sponsors.map((s) => (
              <div key={s.id}>
                {s.linkUrl ? (
                  <a href={s.linkUrl} target="_blank" rel="noopener noreferrer">
                    <img src={s.logoUrl} alt={s.name} className="w-full h-auto object-contain rounded" />
                  </a>
                ) : (
                  <img src={s.logoUrl} alt={s.name} className="w-full h-auto object-contain rounded" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
