import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted-bg">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-lg font-bold text-foreground">
              Liga Metropolitana
            </Link>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              La liga de futsal más competitiva de la región.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Secciones
            </h3>
            <ul className="space-y-2">
              <li><Link href="/equipos" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Equipos</Link></li>
              <li><Link href="/partidos" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Partidos</Link></li>
              <li><Link href="/actualidad" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Actualidad</Link></li>
              <li><Link href="/institucional" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Institucional</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              La Liga
            </h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-muted-foreground">Contacto</span></li>
              <li><span className="text-sm text-muted-foreground">Prensa</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          &copy; {currentYear} Liga Metropolitana de Futsal
        </div>
      </div>
    </footer>
  )
}
