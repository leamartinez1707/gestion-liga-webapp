export interface NavLink {
  label: string
  href: string
}

export const navLinks: NavLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Equipos", href: "/equipos" },
  { label: "Partidos", href: "/partidos" },
  { label: "Actualidad", href: "/actualidad" },
  { label: "Institucional", href: "/institucional" },
]
