import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "./types";

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/submit',
  '/settings',
  '/profile',
]

// Routes that require moderator or admin role
// const MODERATOR_ROUTES = ['/admin']

// Routes that are only accessible when NOT logged in
const AUTH_ROUTES = ['/login', '/signup']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const redirectWithCookies = (url: URL) => {
    const response = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session — important for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirect logged-in users away from auth pages
  if (user && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return redirectWithCookies(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users away from protected pages
  if (!user && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return redirectWithCookies(redirectUrl)
  }

  // Protect admin routes — requires moderator+ role check
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return redirectWithCookies(new URL('/login', request.url))
    }

    // Fetch role from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, banned_at')
      .eq('id', user.id)
      .single()

    const isModerator = profile?.role === 'moderator' || profile?.role === 'admin'
    const isBanned = !!profile?.banned_at

    if (isBanned || !isModerator) {
      return redirectWithCookies(new URL('/', request.url))
    }
  }

  // Redirect banned users to a banned page
  if (user && !pathname.startsWith('/banned') && !pathname.startsWith('/auth')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('banned_at')
      .eq('id', user.id)
      .single()

    if (profile?.banned_at) {
      return redirectWithCookies(new URL('/banned', request.url))
    }
  }

  return supabaseResponse
}
