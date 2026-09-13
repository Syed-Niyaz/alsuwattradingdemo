'use client'

import { useState } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    // Demo / fallback mode if Supabase env is not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const email = (formData.get('email') as string)?.trim().toLowerCase()
      const role = email.includes('admin') ? 'admin' : 'salesperson'
      document.cookie = `demo_role=${role}; path=/; max-age=3600; SameSite=Lax`

      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
      return
    }

    try {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      }
    } catch (err: any) {
      // Next.js redirect() throws a NEXT_REDIRECT digest which is normal
      if (err?.message === 'NEXT_REDIRECT' || err?.digest?.startsWith('NEXT_REDIRECT')) {
        return
      }
      setError(err?.message || 'An unexpected error occurred.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">

        {/* Decorative top accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

        <CardHeader className="space-y-2 text-center pt-8 pb-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/30 mb-2">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            MELAMINE <span className="text-blue-600 font-semibold text-lg ml-1">OrderFlow</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Sign in with your corporate email and password to access the portal
          </CardDescription>
        </CardHeader>

        <form action={handleSubmit}>
          <CardContent className="space-y-4 pt-2 pb-6">
            {error && (
              <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Corporate Email
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@melamine.com"
                  className="pl-9 bg-slate-50/50 dark:bg-slate-900/50"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-9 pr-9 bg-slate-50/50 dark:bg-slate-900/50"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pb-8">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying credentials...
                </span>
              ) : (
                'Sign In to Portal'
              )}
            </Button>

            <div className="text-center text-[11px] text-slate-400">
              Internal Enterprise System • Authorized Personnel Only
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
