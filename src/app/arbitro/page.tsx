import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { getSessionProfile, isStaff } from "@/lib/auth"
import { getMatches } from "@/lib/db/matches"
import { MatchStatusBadge } from "@/components/match-status-badge"

function formatDate(dateStr: string): string {
  if (!dateStr) return "Fecha a confirmar"
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
}

/** Today and a week ago as YYYY-MM-DD in Argentina (the server runs in UTC). */
function dateWindow(): { today: string; weekAgo: string } {
  const toDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  return { today: toDay(now), weekAgo: toDay(weekAgo) }
}

export default async function ArbitroPage() {
  const profile = await getSessionProfile()
  const { data: matches } = await getMatches()

  const { today, weekAgo } = dateWindow()

  // Referee: their matches. Staff: today's matches of the whole league.
  const mine = (matches ?? []).filter((m) =>
    profile && isStaff(profile) ? m.date === today || m.status === "ongoing" : m.refereeId === profile?.id
  )
  const live = mine.filter((m) => m.status === "ongoing")
  const upcoming = mine
    .filter((m) => m.status === "scheduled" || m.status === "postponed")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const recent = mine
    .filter((m) => m.status === "finished" && m.date >= weekAgo)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))

  const sections = [
    { title: "En juego", list: live },
    { title: "Próximos", list: upcoming },
    { title: "Terminados (últimos 7 días)", list: recent },
  ].filter((s) => s.list.length > 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Mis partidos</h1>
        <p className="text-sm text-muted-foreground">Tocá un partido para cargar goles y tarjetas.</p>
      </div>

      {sections.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
          No tenés partidos asignados. La liga te los asigna desde el fixture.
        </p>
      )}

      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</h2>
          {section.list.map((m) => (
            <Link
              key={m.id}
              href={`/arbitro/partido/${m.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 active:bg-muted-bg"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-tight">
                  {m.homeTeamName} <span className="text-muted-foreground font-normal">vs</span> {m.awayTeamName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(m.date)}{m.time && ` · ${m.time.slice(0, 5)} hs`}{m.venue && ` · ${m.venue}`}
                </p>
              </div>
              {m.status === "finished" || m.status === "ongoing" ? (
                <span className="text-xl font-black tabular-nums">{m.homeScore ?? 0}-{m.awayScore ?? 0}</span>
              ) : (
                <MatchStatusBadge match={m} />
              )}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))}
        </section>
      ))}
    </div>
  )
}
