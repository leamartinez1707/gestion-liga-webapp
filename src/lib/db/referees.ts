import { createClient } from "@/lib/supabase/server"

export interface Referee {
  id: string
  email: string
  /** Name, or the email when it has none */
  label: string
}

/** Staff only (profiles RLS). */
export async function getReferees(): Promise<Referee[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from("profiles").select("id, email, display_name").eq("role", "referee").order("email")
    return (data ?? []).map((r) => ({ id: r.id, email: r.email, label: r.display_name?.trim() || r.email }))
  } catch {
    return []
  }
}
