'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'
import { useLang } from '@/context/lang-context'
import { useAuth } from '@/context/auth-context'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const { lang, isRtl } = useLang()
  const ar = lang === 'ar'
  const { user, profile, displayName, displayRole, initials, refreshProfile } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (profile || user) {
      setFullName(profile?.full_name || displayName || '')
      setEmail(profile?.email || user?.email || '')
    }
  }, [profile, user, displayName])

  const handleSave = async () => {
    setSaving(true)
    setErrorMessage(null)
    setShowSuccess(false)

    const supabase = createClient()
    if (supabase && user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        setErrorMessage(error.message)
        setSaving(false)
        return
      }

      await refreshProfile()
    }

    setSaving(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div className="max-w-4xl space-y-6 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {ar ? 'ملفي الشخصي' : 'My Profile'}
        </h2>
        <p className="text-muted-foreground mt-1">
          {ar ? 'إدارة إعدادات حسابك' : 'Manage your account settings'}
        </p>
      </div>

      {/* Top Card: Summary */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-950">
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 text-2xl font-bold shadow-inner">
              {initials}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {fullName || displayName}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {displayRole} • MELAMINE OrderFlow
              </p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Card: Personal Information */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-950 overflow-hidden relative">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4 bg-slate-50/50 dark:bg-slate-900/20">
          <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">
            {ar ? 'المعلومات الشخصية' : 'Personal Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {ar ? 'الاسم الكامل' : 'Full Name'}
              </Label>
              <Input 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {ar ? 'البريد الإلكتروني' : 'Email Address'}
              </Label>
              <Input 
                value={email}
                disabled
                className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 cursor-not-allowed"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {ar ? 'الدور الوظيفي' : 'Role'}
              </Label>
              <Input 
                value={displayRole}
                disabled
                className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
              {errorMessage}
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <Button 
              className="bg-blue-700 hover:bg-blue-800 text-white px-6" 
              onClick={handleSave}
              disabled={saving}
            >
              <Save className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> 
              {saving ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? 'حفظ التغييرات' : 'Save Changes')}
            </Button>
            
            {showSuccess && (
              <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center animate-in fade-in zoom-in duration-300">
                ✓ {ar ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
