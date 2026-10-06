// Generated from the Supabase project (gestion-ligas-webapp). Do not edit by hand:
// regenerate after each migration (Supabase MCP generate_typescript_types or
// `supabase gen types typescript --project-id adhdyoeravuztzduifpl`).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      divisions: {
        Row: { created_at: string | null; display_order: number | null; id: string; name: string; series_id: string | null }
        Insert: { created_at?: string | null; display_order?: number | null; id?: string; name: string; series_id?: string | null }
        Update: { created_at?: string | null; display_order?: number | null; id?: string; name?: string; series_id?: string | null }
        Relationships: [
          { foreignKeyName: "divisions_series_id_fkey"; columns: ["series_id"]; isOneToOne: false; referencedRelation: "series"; referencedColumns: ["id"] },
        ]
      }
      goals: {
        Row: { created_at: string | null; goals: number; id: string; match_id: string | null; player_id: string | null }
        Insert: { created_at?: string | null; goals?: number; id?: string; match_id?: string | null; player_id?: string | null }
        Update: { created_at?: string | null; goals?: number; id?: string; match_id?: string | null; player_id?: string | null }
        Relationships: [
          { foreignKeyName: "goals_match_id_fkey"; columns: ["match_id"]; isOneToOne: false; referencedRelation: "matches"; referencedColumns: ["id"] },
          { foreignKeyName: "goals_player_id_fkey"; columns: ["player_id"]; isOneToOne: false; referencedRelation: "players"; referencedColumns: ["id"] },
        ]
      }
      league_settings: {
        Row: { id: boolean; red_card_matches: number; updated_at: string | null; yellow_cards_for_suspension: number; yellow_suspension_matches: number }
        Insert: { id?: boolean; red_card_matches?: number; updated_at?: string | null; yellow_cards_for_suspension?: number; yellow_suspension_matches?: number }
        Update: { id?: boolean; red_card_matches?: number; updated_at?: string | null; yellow_cards_for_suspension?: number; yellow_suspension_matches?: number }
        Relationships: []
      }
      match_events: {
        Row: { assist_player_id: string | null; created_at: string | null; created_by: string | null; id: string; match_id: string; period: string | null; player_id: string | null; team_id: string; type: string }
        Insert: { assist_player_id?: string | null; created_at?: string | null; created_by?: string | null; id?: string; match_id: string; period?: string | null; player_id?: string | null; team_id: string; type: string }
        Update: { assist_player_id?: string | null; created_at?: string | null; created_by?: string | null; id?: string; match_id?: string; period?: string | null; player_id?: string | null; team_id?: string; type?: string }
        Relationships: [
          { foreignKeyName: "match_events_assist_player_id_fkey"; columns: ["assist_player_id"]; isOneToOne: false; referencedRelation: "players"; referencedColumns: ["id"] },
          { foreignKeyName: "match_events_match_id_fkey"; columns: ["match_id"]; isOneToOne: false; referencedRelation: "matches"; referencedColumns: ["id"] },
          { foreignKeyName: "match_events_player_id_fkey"; columns: ["player_id"]; isOneToOne: false; referencedRelation: "players"; referencedColumns: ["id"] },
          { foreignKeyName: "match_events_team_id_fkey"; columns: ["team_id"]; isOneToOne: false; referencedRelation: "teams"; referencedColumns: ["id"] },
        ]
      }
      matches: {
        Row: {
          away_score: number | null; away_team_id: string | null; created_at: string | null; date: string | null
          home_score: number | null; home_team_id: string | null; id: string; matchday: number | null
          status: string | null; time: string | null; tournament_id: string | null; venue: string | null
          walkover: boolean; notes: string | null; referee_id: string | null; live_period: string | null
        }
        Insert: {
          away_score?: number | null; away_team_id?: string | null; created_at?: string | null; date?: string | null
          home_score?: number | null; home_team_id?: string | null; id?: string; matchday?: number | null
          status?: string | null; time?: string | null; tournament_id?: string | null; venue?: string | null
          walkover?: boolean; notes?: string | null; referee_id?: string | null; live_period?: string | null
        }
        Update: {
          away_score?: number | null; away_team_id?: string | null; created_at?: string | null; date?: string | null
          home_score?: number | null; home_team_id?: string | null; id?: string; matchday?: number | null
          status?: string | null; time?: string | null; tournament_id?: string | null; venue?: string | null
          walkover?: boolean; notes?: string | null; referee_id?: string | null; live_period?: string | null
        }
        Relationships: [
          { foreignKeyName: "matches_away_team_id_fkey"; columns: ["away_team_id"]; isOneToOne: false; referencedRelation: "teams"; referencedColumns: ["id"] },
          { foreignKeyName: "matches_home_team_id_fkey"; columns: ["home_team_id"]; isOneToOne: false; referencedRelation: "teams"; referencedColumns: ["id"] },
          { foreignKeyName: "matches_tournament_id_fkey"; columns: ["tournament_id"]; isOneToOne: false; referencedRelation: "tournaments"; referencedColumns: ["id"] },
        ]
      }
      news_articles: {
        Row: {
          author: string | null; category: string | null; content: string | null; created_at: string | null
          date: string | null; excerpt: string | null; id: string; image_url: string | null; pdf_url: string | null
          match_id: string | null; published: boolean | null; series_id: string | null; title: string
        }
        Insert: {
          author?: string | null; category?: string | null; content?: string | null; created_at?: string | null
          date?: string | null; excerpt?: string | null; id?: string; image_url?: string | null; pdf_url?: string | null
          match_id?: string | null; published?: boolean | null; series_id?: string | null; title: string
        }
        Update: {
          author?: string | null; category?: string | null; content?: string | null; created_at?: string | null
          date?: string | null; excerpt?: string | null; id?: string; image_url?: string | null; pdf_url?: string | null
          match_id?: string | null; published?: boolean | null; series_id?: string | null; title?: string
        }
        Relationships: [
          { foreignKeyName: "news_articles_match_id_fkey"; columns: ["match_id"]; isOneToOne: false; referencedRelation: "matches"; referencedColumns: ["id"] },
          { foreignKeyName: "news_articles_series_id_fkey"; columns: ["series_id"]; isOneToOne: false; referencedRelation: "series"; referencedColumns: ["id"] },
        ]
      }
      photo_albums: {
        Row: {
          cover_url: string | null; created_at: string | null; date: string | null; description: string | null
          id: string; match_id: string | null; published: boolean; series_id: string | null; title: string
        }
        Insert: {
          cover_url?: string | null; created_at?: string | null; date?: string | null; description?: string | null
          id?: string; match_id?: string | null; published?: boolean; series_id?: string | null; title: string
        }
        Update: {
          cover_url?: string | null; created_at?: string | null; date?: string | null; description?: string | null
          id?: string; match_id?: string | null; published?: boolean; series_id?: string | null; title?: string
        }
        Relationships: [
          { foreignKeyName: "photo_albums_match_id_fkey"; columns: ["match_id"]; isOneToOne: false; referencedRelation: "matches"; referencedColumns: ["id"] },
          { foreignKeyName: "photo_albums_series_id_fkey"; columns: ["series_id"]; isOneToOne: false; referencedRelation: "series"; referencedColumns: ["id"] },
        ]
      }
      photos: {
        Row: { album_id: string; caption: string | null; created_at: string | null; display_order: number; id: string; thumb_url: string | null; url: string }
        Insert: { album_id: string; caption?: string | null; created_at?: string | null; display_order?: number; id?: string; thumb_url?: string | null; url: string }
        Update: { album_id?: string; caption?: string | null; created_at?: string | null; display_order?: number; id?: string; thumb_url?: string | null; url?: string }
        Relationships: [
          { foreignKeyName: "photos_album_id_fkey"; columns: ["album_id"]; isOneToOne: false; referencedRelation: "photo_albums"; referencedColumns: ["id"] },
        ]
      }
      players: {
        Row: {
          active: boolean | null; created_at: string | null; id: string; name: string; number: number | null
          photo_url: string | null; position: string | null; team_id: string | null
        }
        Insert: {
          active?: boolean | null; created_at?: string | null; id?: string; name: string; number?: number | null
          photo_url?: string | null; position?: string | null; team_id?: string | null
        }
        Update: {
          active?: boolean | null; created_at?: string | null; id?: string; name?: string; number?: number | null
          photo_url?: string | null; position?: string | null; team_id?: string | null
        }
        Relationships: [
          { foreignKeyName: "players_team_id_fkey"; columns: ["team_id"]; isOneToOne: false; referencedRelation: "teams"; referencedColumns: ["id"] },
        ]
      }
      profiles: {
        Row: { created_at: string | null; email: string; id: string; role: string; team_id: string | null }
        Insert: { created_at?: string | null; email: string; id: string; role?: string; team_id?: string | null }
        Update: { created_at?: string | null; email?: string; id?: string; role?: string; team_id?: string | null }
        Relationships: [
          { foreignKeyName: "profiles_team_id_fkey"; columns: ["team_id"]; isOneToOne: false; referencedRelation: "teams"; referencedColumns: ["id"] },
        ]
      }
      registration_players: {
        Row: { created_at: string | null; player_id: string; registration_id: string; tournament_id: string }
        Insert: { created_at?: string | null; player_id: string; registration_id: string; tournament_id?: string }
        Update: { created_at?: string | null; player_id?: string; registration_id?: string; tournament_id?: string }
        Relationships: [
          { foreignKeyName: "registration_players_player_id_fkey"; columns: ["player_id"]; isOneToOne: false; referencedRelation: "players"; referencedColumns: ["id"] },
          { foreignKeyName: "registration_players_registration_id_fkey"; columns: ["registration_id"]; isOneToOne: false; referencedRelation: "registrations"; referencedColumns: ["id"] },
          { foreignKeyName: "registration_players_tournament_id_fkey"; columns: ["tournament_id"]; isOneToOne: false; referencedRelation: "tournaments"; referencedColumns: ["id"] },
        ]
      }
      registrations: {
        Row: { created_at: string | null; id: string; team_id: string; tournament_id: string; withdrawn_at: string | null }
        Insert: { created_at?: string | null; id?: string; team_id: string; tournament_id: string; withdrawn_at?: string | null }
        Update: { created_at?: string | null; id?: string; team_id?: string; tournament_id?: string; withdrawn_at?: string | null }
        Relationships: [
          { foreignKeyName: "registrations_team_id_fkey"; columns: ["team_id"]; isOneToOne: false; referencedRelation: "teams"; referencedColumns: ["id"] },
          { foreignKeyName: "registrations_tournament_id_fkey"; columns: ["tournament_id"]; isOneToOne: false; referencedRelation: "tournaments"; referencedColumns: ["id"] },
        ]
      }
      sanctions: {
        Row: {
          card_type: string | null; created_at: string | null; expires_after_match: number | null; id: string
          match_date: string | null; match_id: string | null; matches_suspended: number | null; player_id: string | null
          source: string
        }
        Insert: {
          card_type?: string | null; created_at?: string | null; expires_after_match?: number | null; id?: string
          match_date?: string | null; match_id?: string | null; matches_suspended?: number | null; player_id?: string | null
          source?: string
        }
        Update: {
          card_type?: string | null; created_at?: string | null; expires_after_match?: number | null; id?: string
          match_date?: string | null; match_id?: string | null; matches_suspended?: number | null; player_id?: string | null
          source?: string
        }
        Relationships: [
          { foreignKeyName: "sanctions_match_id_fkey"; columns: ["match_id"]; isOneToOne: false; referencedRelation: "matches"; referencedColumns: ["id"] },
          { foreignKeyName: "sanctions_player_id_fkey"; columns: ["player_id"]; isOneToOne: false; referencedRelation: "players"; referencedColumns: ["id"] },
        ]
      }
      series: {
        Row: { created_at: string | null; description: string | null; id: string; name: string; slug: string }
        Insert: { created_at?: string | null; description?: string | null; id?: string; name: string; slug: string }
        Update: { created_at?: string | null; description?: string | null; id?: string; name?: string; slug?: string }
        Relationships: []
      }
      sponsors: {
        Row: { created_at: string | null; display_order: number | null; id: string; link_url: string | null; logo_url: string; name: string }
        Insert: { created_at?: string | null; display_order?: number | null; id?: string; link_url?: string | null; logo_url: string; name: string }
        Update: { created_at?: string | null; display_order?: number | null; id?: string; link_url?: string | null; logo_url?: string; name?: string }
        Relationships: []
      }
      teams: {
        Row: {
          assistant_coach: string | null; category: string | null; coach: string | null; created_at: string | null
          division_id: string | null; id: string; name: string; series_id: string | null; shield_url: string | null
          short_name: string; tournament_id: string | null
        }
        Insert: {
          assistant_coach?: string | null; category?: string | null; coach?: string | null; created_at?: string | null
          division_id?: string | null; id?: string; name: string; series_id?: string | null; shield_url?: string | null
          short_name: string; tournament_id?: string | null
        }
        Update: {
          assistant_coach?: string | null; category?: string | null; coach?: string | null; created_at?: string | null
          division_id?: string | null; id?: string; name?: string; series_id?: string | null; shield_url?: string | null
          short_name?: string; tournament_id?: string | null
        }
        Relationships: [
          { foreignKeyName: "teams_division_id_fkey"; columns: ["division_id"]; isOneToOne: false; referencedRelation: "divisions"; referencedColumns: ["id"] },
          { foreignKeyName: "teams_series_id_fkey"; columns: ["series_id"]; isOneToOne: false; referencedRelation: "series"; referencedColumns: ["id"] },
          { foreignKeyName: "teams_tournament_id_fkey"; columns: ["tournament_id"]; isOneToOne: false; referencedRelation: "tournaments"; referencedColumns: ["id"] },
        ]
      }
      tournaments: {
        Row: {
          category: string | null; created_at: string | null; division_id: string | null; end_date: string | null
          format: string; id: string; name: string; season: string; series_id: string | null; start_date: string | null
        }
        Insert: {
          category?: string | null; created_at?: string | null; division_id?: string | null; end_date?: string | null
          format: string; id?: string; name: string; season: string; series_id?: string | null; start_date?: string | null
        }
        Update: {
          category?: string | null; created_at?: string | null; division_id?: string | null; end_date?: string | null
          format?: string; id?: string; name?: string; season?: string; series_id?: string | null; start_date?: string | null
        }
        Relationships: [
          { foreignKeyName: "tournaments_division_id_fkey"; columns: ["division_id"]; isOneToOne: false; referencedRelation: "divisions"; referencedColumns: ["id"] },
          { foreignKeyName: "tournaments_series_id_fkey"; columns: ["series_id"]; isOneToOne: false; referencedRelation: "series"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      assign_delegate: { Args: { p_email: string; p_team_id: string }; Returns: undefined }
      is_staff: { Args: never; Returns: boolean }
      my_team_id: { Args: never; Returns: string }
      revoke_delegate: { Args: { p_team_id: string }; Returns: undefined }
      withdraw_team: { Args: { p_registration_id: string }; Returns: number }
      can_edit_match: { Args: { p_match_id: string }; Returns: boolean }
      set_referee: { Args: { p_email: string; p_is_referee: boolean }; Returns: undefined }
      unassign_delegate: { Args: { p_profile_id: string }; Returns: undefined }
      recompute_accumulation: { Args: { p_player_id: string; p_tournament_id: string }; Returns: undefined }
      recompute_match: { Args: { p_match_id: string }; Returns: undefined }
      set_match_live_state: { Args: { p_match_id: string; p_status: string; p_period: string | null }; Returns: undefined }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
