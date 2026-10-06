"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getSessionProfile, homeFor } from "@/lib/auth"

/**
 * Returns the error instead of throwing it: in production Next.js hides the
 * message of thrown errors, so a wrong password showed up as a generic 500.
 */
export async function signIn(
  _prev: { error: string | null } | undefined,
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: ((formData.get("email") as string | null) ?? "").trim(),
    password: (formData.get("password") as string | null) ?? "",
  })

  if (error) {
    return {
      error:
        error.code === "invalid_credentials"
          ? "Email o contraseña incorrectos."
          : "No se pudo iniciar sesión. Intentá de nuevo.",
    }
  }

  // Each role lands on its own panel
  const profile = await getSessionProfile()
  redirect(profile ? homeFor(profile) : "/admin")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
