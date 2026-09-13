'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function signOutAction() {
  const supabase = await createClient()

  if (supabase) {
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore errors on signout
    }
  }

  // Clear demo fallback cookie if any
  try {
    const cookieStore = await cookies()
    cookieStore.delete('demo_role')
  } catch {
    // Ignore error in server action
  }

  redirect('/login')
}
