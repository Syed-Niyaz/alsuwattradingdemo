import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  if (supabase) {
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore errors on signout
    }
  }

  const cookieStore = await cookies()
  cookieStore.delete('demo_role')

  const redirectUrl = new URL('/login', request.url)
  return NextResponse.redirect(redirectUrl)
}

export async function POST(request: NextRequest) {
  return GET(request)
}
