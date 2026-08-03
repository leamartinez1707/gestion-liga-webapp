import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-primary mt-auto">
      <div className="mx-auto px-4 py-10 max-w-6xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-base font-extrabold text-white tracking-tight">
              LIGA METROPOLITANA
            </Link>
            <p className="mt-2 text-sm text-white/60 max-w-xs">
              La liga de futsal más competitiva de la región.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Secciones</h3>
            <ul className="space-y-2">
              <li><Link href="/equipos" className="text-sm text-white/70 hover:text-white transition-colors">Equipos</Link></li>
              <li><Link href="/partidos" className="text-sm text-white/70 hover:text-white transition-colors">Partidos</Link></li>
              <li><Link href="/actualidad" className="text-sm text-white/70 hover:text-white transition-colors">Actualidad</Link></li>
              <li><Link href="/institucional" className="text-sm text-white/70 hover:text-white transition-colors">Institucional</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">La Liga</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-white/50">Contacto</span></li>
              <li><span className="text-sm text-white/50">Prensa</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/40">
          &copy; {currentYear} Liga Metropolitana de Futsal
        </div>
      </div>
    </footer>
  )
}
