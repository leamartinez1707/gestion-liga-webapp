export interface Series {
  id: string
  name: string
  slug: string
  description?: string
}

export interface Division {
  id: string
  seriesId: string
  name: string
  displayOrder: number
}

export interface Tournament {
  id: string
  name: string
  category?: string        // display category (e.g., "Primera División")
  seriesId?: string
  divisionId?: string
  season: string
  format: "league" | "elimination" | "groups"
  startDate?: string
  endDate?: string
}

export interface Team {
  id: string
  name: string
  shortName: string
  shield: string
  category?: string        // display category (e.g., "Primera División")
  seriesId?: string
  divisionId?: string
  coach: string
  assistantCoach?: string
  tournamentId?: string
}

/** A team (club) entered in a tournament; the tournament gives series, division and season. */
export interface Registration {
  id: string
  tournamentId: string
  teamId: string
  /** Set when the team left the tournament (pending matches became W.O.) */
  withdrawnAt?: string
}

export interface Player {
  id: string
  name: string
  number: number
  position: "arquero" | "defensa" | "mediocampista" | "delantero"
  photo?: string
  teamId: string
  active: boolean
}

export interface Match {
  id: string
  homeTeamId: string
  awayTeamId: string
  date: string
  time: string
  homeScore?: number
  awayScore?: number
  /** postponed = suspendido (se reprograma), cancelled = no se juega; ninguno cuenta en la tabla */
  status: "scheduled" | "ongoing" | "finished" | "postponed" | "cancelled"
  matchday: number
  tournamentId: string
  venue?: string
  /** Won by W.O. (always 3-0) */
  walkover?: boolean
  /** Public note, e.g. "Suspendido por lluvia" */
  notes?: string
}

export interface Sanction {
  id: string
  playerId: string
  matchId?: string
  cardType: "yellow" | "red"
  matchDate: string
  matchesSuspended: number
  expiresAfterMatch?: number
}

export interface NewsArticle {
  id: string
  title: string
  excerpt: string
  content: string
  image: string
  date: string
  category: string
  seriesId?: string
  published?: boolean
}

export interface LeagueInfo {
  name: string
  description: string
  currentSeason: string
  ctaText: string
  ctaHref: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
  error: string | null
}

export interface Sponsor {
  id: string
  name: string
  logoUrl: string
  linkUrl?: string
  displayOrder: number
}
