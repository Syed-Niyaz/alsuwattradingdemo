import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/reset-password'

  if (code) {
    const supabase = await createClient()
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url))
      }
    }
  }

  // If error or code missing, redirect to login with an error message
  const errorRedirect = new URL('/login', request.url)
  errorRedirect.searchParams.set('error', 'Auth code verification failed or expired. Please try again.')
  return NextResponse.redirect(errorRedirect)
}
