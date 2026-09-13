import { createClient } from './server'
import { redirect } from 'next/navigation'

export type UserRole = 'admin' | 'salesperson'

export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export async function getCurrentUser() {
  const supabase = await createClient()
  if (!supabase) return null

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
  } catch {
    return null
  }
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  if (!supabase) return null

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return null

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      // Return fallback profile using user metadata if profile row is pending creation
      return {
        id: user.id,
        full_name: (user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]) ?? 'User',
        email: user.email ?? null,
        role: (user.user_metadata?.role === 'admin' ? 'admin' : 'salesperson') as UserRole,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      }
    }

    return profile as UserProfile
  } catch {
    return null
  }
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    if (profile.role === 'salesperson') {
      redirect('/dashboard')
    } else {
      redirect('/admin')
    }
  }

  return profile
}
