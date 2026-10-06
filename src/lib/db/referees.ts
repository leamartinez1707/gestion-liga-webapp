import { createClient } from "@/lib/supabase/server"

export interface Referee {
  id: string
  email: string
}

/** Staff only (profiles RLS). */
export async function getReferees(): Promise<Referee[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from("profiles").select("id, email").eq("role", "referee").order("email")
    return data ?? []
  } catch {
    return []
  }
}
