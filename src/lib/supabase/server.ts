import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "./types"

/**
 * Read-only Supabase client for Server Components (pages, layouts).
 * Uses the anon key WITHOUT cookie writing — safe for public data reads.
 * Do NOT use this for authenticated mutations.
 */
export function createReadOnlyClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Supabase client bound to the signed-in user's session (RLS applies as that user).
 * Usable in Server Actions, Route Handlers and Server Components. In Server
 * Components cookies are read-only, so refreshed tokens can't be written there;
 * that's fine because the proxy (src/proxy.ts) refreshes the session first.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — ignore (see comment above).
          }
        },
      },
    }
  )
}
