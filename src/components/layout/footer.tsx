import Link from "next/link"
import { Globe } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary mb-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                LM
              </span>
              Liga Metropolitana
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              La liga de futsal más competitiva de la región. Pasión, talento y deporte en cada partido.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Enlaces rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/equipos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Equipos
                </Link>
              </li>
              <li>
                <Link href="/partidos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Partidos
                </Link>
              </li>
              <li>
                <Link href="/actualidad" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Actualidad
                </Link>
              </li>
              <li>
                <Link href="/institucional" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Institucional
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Seguinos</h3>
            <div className="flex gap-3">
              <a
                href="#"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-accent transition-colors"
                aria-label="Instagram"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-accent transition-colors"
                aria-label="YouTube"
              >
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          &copy; {currentYear} Liga Metropolitana de Futsal. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
