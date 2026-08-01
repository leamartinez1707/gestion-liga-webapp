import { type NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          supabaseResponse.headers.set(
            "Cache-Control",
            "private, no-cache, no-store, must-revalidate, max-age=0"
          )
        },
      },
    }
  )

  // Refreshes the session if expired — required for Server Components.
  // getUser() sends a request to the Supabase Auth REST API, which is
  // more reliable than parsing the potentially stale access token.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected admin routes → redirect to login
  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Protected delegate routes → redirect to login
  if (!user && request.nextUrl.pathname.startsWith("/delegado")) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Already authenticated → redirect away from login to admin
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/admin"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/delegado/:path*",
    "/login",
  ],
}
