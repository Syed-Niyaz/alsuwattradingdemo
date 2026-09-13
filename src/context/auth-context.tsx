'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signOutAction } from '@/app/auth/actions'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'salesperson'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  role: UserRole
  initials: string
  displayName: string
  displayRole: string
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (currentUser: User) => {
    const supabase = createClient()
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, updated_at')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (data && !error) {
        setProfile(data as Profile)
      } else {
        // Fallback to metadata
        const metadataRole = currentUser.user_metadata?.role === 'admin' ? 'admin' : 'salesperson'
        const metadataName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User'
        setProfile({
          id: currentUser.id,
          full_name: metadataName,
          email: currentUser.email || null,
          role: metadataRole,
        })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }

  const refreshProfile = async () => {
    const supabase = createClient()
    if (!supabase) return
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) {
      setUser(currentUser)
      await fetchProfile(currentUser)
    }
  }

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) {
      // Demo / fallback mode
      const isClient = typeof document !== 'undefined'
      const demoRole = isClient ? document.cookie.split('; ').find(r => r.startsWith('demo_role='))?.split('=')[1] : null
      const resolvedRole: UserRole = demoRole === 'admin' ? 'admin' : 'salesperson'
      
      setProfile({
        id: 'demo-user-id',
        full_name: resolvedRole === 'admin' ? 'Abdul Khabeer' : 'Ahmad Al Rashid',
        email: resolvedRole === 'admin' ? 'admin@melamine.com' : 'sales@melamine.com',
        role: resolvedRole,
      })
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getUser().then((res: { data: { user: User | null } }) => {
      const initialUser = res.data?.user ?? null
      setUser(initialUser)
      if (initialUser) {
        fetchProfile(initialUser).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen to auth state changes (login, logout, token refresh, password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: { user: User | null } | null) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    setLoading(true)
    await signOutAction()
  }

  const role: UserRole = profile?.role || 'salesperson'
  const displayName = profile?.full_name || user?.email?.split('@')[0] || (role === 'admin' ? 'Abdul Khabeer' : 'Ahmad Al Rashid')
  
  // Calculate user initials
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || (role === 'admin' ? 'AK' : 'AR')

  const displayRole = role === 'admin' ? 'Administrator' : 'Sales Representative'

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        initials,
        displayName,
        displayRole,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
