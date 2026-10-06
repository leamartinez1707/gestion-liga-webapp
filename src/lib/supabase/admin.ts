// Server-only Supabase client with the secret key (bypasses RLS).
// Used ONLY by the user-management actions, after checking the caller is staff.
// The key must be SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix) so it
// never reaches the browser.

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"

export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error("Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor para gestionar usuarios.")
  }
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
