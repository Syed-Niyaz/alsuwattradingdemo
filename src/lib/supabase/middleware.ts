import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/auth/callback', '/auth/confirm']
const ADMIN_PATHS = ['/admin']

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase environment variables are missing (fallback/demo mode)
  if (!url || !key) {
    const demoCookie = request.cookies.get('demo_role')?.value
    const isPublic = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))
    
    if (!demoCookie && !isPublic) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (demoCookie && (pathname === '/login' || pathname === '/forgot-password')) {
      return NextResponse.redirect(new URL(demoCookie === 'admin' ? '/admin' : '/dashboard', request.url))
    }

    if (demoCookie === 'salesperson' && ADMIN_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next({ request })
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh auth token and verify user
  const { data: { user } } = await supabase.auth.getUser()

  const isPublicRoute = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))
  const isAuthCallback = pathname.startsWith('/auth/')

  // If not authenticated and trying to access a protected route
  if (!user && !isPublicRoute && !isAuthCallback) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated and trying to access auth pages (login, forgot-password)
  if (user && (pathname === '/login' || pathname === '/forgot-password')) {
    // Query role from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role || (user.user_metadata?.role === 'admin' ? 'admin' : 'salesperson')
    const destination = role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // Enforce role-based access to Admin routes
  if (user && ADMIN_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role || (user.user_metadata?.role === 'admin' ? 'admin' : 'salesperson')

    if (role !== 'admin') {
      // Salesperson attempting to access admin route is redirected to salesperson dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}
