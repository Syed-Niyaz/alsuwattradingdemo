'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return { error: 'Please enter your email address.' }
  }

  const supabase = await createClient()

  if (!supabase) {
    return { success: true, message: 'If an account exists with this email, a password reset link has been sent.' }
  }

  const headerList = await headers()
  const origin = headerList.get('origin') || headerList.get('host') || ''
  const protocol = origin.startsWith('http') ? '' : 'https://'
  const siteUrl = origin.startsWith('http') ? origin : `${protocol}${origin}`

  const redirectTo = `${siteUrl}/auth/callback?next=/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    if (error.message.toLowerCase().includes('rate limit')) {
      return { 
        error: 'Email rate limit reached for Supabase default mailer (max 3/hour). Please wait 60 seconds or configure custom SMTP in Supabase settings.' 
      }
    }
    return { error: error.message }
  }

  return { success: true, message: 'Password reset instructions have been sent to your email. Please check your inbox and spam folder.' }
}
