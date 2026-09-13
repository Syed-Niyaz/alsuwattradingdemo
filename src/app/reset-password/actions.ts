'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Please enter and confirm your new password.' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()

  if (!supabase) {
    return { error: 'Supabase credentials not configured in environment.' }
  }

  const { data, error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Failed to update password. Session may have expired.' }
  }

  // Retrieve user role from profiles
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
