'use client'

import { useState } from 'react'
import { updatePassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updatePassword(formData)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      }
    } catch (err: any) {
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
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

        <CardHeader className="space-y-2 text-center pt-8 pb-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/30 mb-2">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Set New Password
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Please enter your new secure password below
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
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                New Password
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  className="pl-9 pr-9 bg-slate-50/50 dark:bg-slate-900/50"
                  autoComplete="new-password"
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

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  className="pl-9 pr-9 bg-slate-50/50 dark:bg-slate-900/50"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  Updating password...
                </span>
              ) : (
                'Save New Password & Continue'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
