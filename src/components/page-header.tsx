import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  /** Small line above the title, usually the selected series and division */
  eyebrow?: string
  subtitle?: string
  /** Shown before the title, e.g. the team shield */
  media?: React.ReactNode
  /** Extra controls under the title (e.g. tournament tabs) */
  children?: React.ReactNode
}

/** Navy band that opens every public page: same alignment and type everywhere. */
export function PageHeader({ title, eyebrow, subtitle, media, children }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-primary text-white">
      {/* Pitch stripes, very subtle */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background:repeating-linear-gradient(90deg,#fff_0_120px,transparent_120px_240px)]"
      />
      <div className="page-container relative flex items-center gap-4 py-7 md:gap-6 md:py-9">
        {media && <div className="shrink-0">{media}</div>}
        <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-accent md:text-base">{eyebrow}</p>
        )}
        <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-tight md:text-6xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-white/70 md:text-base">{subtitle}</p>}
        {children && <div className="mt-5">{children}</div>}
        </div>
      </div>
    </section>
  )
}

/** Section heading inside a page: condensed caps with a green accent bar. */
export function SectionTitle({ children, className, action }: { children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-3", className)}>
      <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold uppercase leading-none tracking-wide">
        <span aria-hidden className="h-6 w-1.5 rounded-sm bg-secondary" />
        {children}
      </h2>
      {action}
    </div>
  )
}
