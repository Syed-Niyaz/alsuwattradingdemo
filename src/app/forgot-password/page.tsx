'use client'

import { useState } from 'react'
import { requestPasswordReset } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    const result = await requestPasswordReset(formData)

    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccessMessage(result.message || 'Password reset email sent. Please check your inbox.')
    }
    setIsLoading(false)
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
            Reset Password
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Enter your email address and we will send you a link to reset your password
          </CardDescription>
        </CardHeader>

        {successMessage ? (
          <CardContent className="space-y-6 pt-4 pb-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Check your email
              </p>
              <p className="text-xs text-slate-500 leading-relaxed px-4">
                {successMessage}
              </p>
            </div>
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-md shadow-blue-600/20 text-sm"
            >
              Return to sign in
            </Link>
          </CardContent>
        ) : (
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
                  Account Email Address
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
                    Sending link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
