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

/** Staff only (RPC): makes an existing user a referee, or turns it back. */
export async function setReferee(email: string, isReferee: boolean): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc("set_referee", { p_email: email, p_is_referee: isReferee })
    return error ? { error: error.message } : {}
  } catch {
    return { error: "No se pudo actualizar el árbitro." }
  }
}
