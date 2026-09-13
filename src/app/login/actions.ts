'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Please enter both email and password.' }
  }

  const supabase = await createClient()

  if (!supabase) {
    return { error: 'Supabase credentials are not configured in .env.local' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Return friendly error messages for standard auth errors
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return { error: 'Invalid email or password. Please check your credentials.' }
    }
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Your email address has not been confirmed yet.' }
    }
    return { error: error.message }
  }

  if (!data?.user) {
    return { error: 'Sign-in failed. Please try again.' }
  }

  // Strictly retrieve role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  const role = profile?.role || data.user.user_metadata?.role || 'salesperson'

  if (role === 'admin') {
    redirect('/admin')
  } else {
    redirect('/dashboard')
  }
}
