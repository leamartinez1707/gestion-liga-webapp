// ---------------------------------------------------------------------------
// Database type definitions matching the SQL schema in schema.sql.
// These mirror the public tables and their row types for type-safe Supabase
// queries across both client and server.
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, "created_at">
        Update: Partial<Omit<Profile, "id">>
      }
      series: {
        Row: Series
        Insert: Omit<Series, "id" | "created_at">
        Update: Partial<Omit<Series, "id">>
      }
      divisions: {
        Row: Division
        Insert: Omit<Division, "id" | "created_at">
        Update: Partial<Omit<Division, "id">>
      }
      tournaments: {
        Row: Tournament
        Insert: Omit<Tournament, "id" | "created_at">
        Update: Partial<Omit<Tournament, "id">>
      }
      teams: {
        Row: Team
        Insert: Omit<Team, "id" | "created_at">
        Update: Partial<Omit<Team, "id">>
      }
      players: {
        Row: Player
        Insert: Omit<Player, "id" | "created_at">
        Update: Partial<Omit<Player, "id">>
      }
      matches: {
        Row: Match
        Insert: Omit<Match, "id" | "created_at">
        Update: Partial<Omit<Match, "id">>
      }
      sanctions: {
        Row: Sanction
        Insert: Omit<Sanction, "id" | "created_at">
        Update: Partial<Omit<Sanction, "id">>
      }
      news_articles: {
        Row: NewsArticle
        Insert: Omit<NewsArticle, "id" | "created_at">
        Update: Partial<Omit<NewsArticle, "id">>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ---- Row types ------------------------------------------------------------

export interface Profile {
  id: string
  email: string
  role: "superadmin" | "editor"
  created_at: string
}

export interface Series {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface Division {
  id: string
  series_id: string
  name: string
  display_order: number
  created_at: string
}

export interface Tournament {
  id: string
  name: string
  category: string
  series_id: string | null
  division_id: string | null
  season: string
  format: "league" | "elimination" | "groups"
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface Team {
  id: string
  name: string
  short_name: string
  shield_url: string | null
  category: string
  series_id: string | null
  division_id: string | null
  coach: string | null
  assistant_coach: string | null
  tournament_id: string | null
  created_at: string
}

export interface Player {
  id: string
  name: string
  number: number | null
  position: "arquero" | "defensa" | "mediocampista" | "delantero" | null
  photo_url: string | null
  team_id: string | null
  active: boolean
  created_at: string
}

export interface Match {
  id: string
  tournament_id: string | null
  home_team_id: string | null
  away_team_id: string | null
  matchday: number | null
  date: string | null
  time: string | null
  home_score: number | null
  away_score: number | null
  status: "scheduled" | "ongoing" | "finished"
  venue: string | null
  created_at: string
}

export interface Sanction {
  id: string
  player_id: string | null
  match_id: string | null
  card_type: "yellow" | "red" | null
  match_date: string | null
  matches_suspended: number
  expires_after_match: number | null
  created_at: string
}

export interface NewsArticle {
  id: string
  title: string
  excerpt: string | null
  content: string | null
  image_url: string | null
  pdf_url: string | null
  author: string | null
  category: string | null
  series_id: string | null
  published: boolean
  date: string
  created_at: string
}
