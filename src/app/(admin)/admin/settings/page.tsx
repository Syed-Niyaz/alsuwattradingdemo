'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Bell, Shield, Globe, Database, Save } from 'lucide-react'
import { useLang } from '@/context/lang-context'

export default function AdminSettingsPage() {
  const { isRtl } = useLang()

  return (
    <div className="space-y-6 pb-24 max-w-4xl" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your system preferences and configurations</p>
      </div>

      {/* Company Info */}
      <Card className="border-none shadow-sm shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 pb-4">
          <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" /> Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Company Name</Label>
            <Input defaultValue="MELAMINE Pte Ltd" className="bg-white dark:bg-slate-900" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tax ID / VAT Number</Label>
            <Input defaultValue="300001234567890" className="bg-white dark:bg-slate-900 font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Business Email</Label>
            <Input defaultValue="admin@melamine.com" className="bg-white dark:bg-slate-900" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Phone</Label>
            <Input defaultValue="+966 13 812 3456" className="bg-white dark:bg-slate-900" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Address</Label>
            <Input defaultValue="King Fahd Road, Al Khobar 31952, Saudi Arabia" className="bg-white dark:bg-slate-900" />
          </div>
          <div className="md:col-span-2">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-none shadow-sm shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 pb-4">
          <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" /> Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[
            { label: 'Discount Approval Requests', desc: 'Get notified when a salesperson requests a discount above the threshold' },
            { label: 'New Quotation Generated', desc: 'Get notified when any salesperson creates a new quotation' },
            { label: 'Customer Accepted Quotation', desc: 'Get notified when a customer accepts a quotation' },
            { label: 'Low Stock Alert', desc: 'Get notified when any product falls below 10 units' },
          ].map((item, i) => (
            <div key={i} className="flex items-start justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4 mt-0.5">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:bg-blue-600 transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-none shadow-sm shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 pb-4">
          <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" /> Security & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Max Discount % (Salesperson)</Label>
            <Input defaultValue="10" type="number" className="bg-white dark:bg-slate-900 font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Auto-approve Discount Below (%)</Label>
            <Input defaultValue="5" type="number" className="bg-white dark:bg-slate-900 font-mono" />
          </div>
          <div className="md:col-span-2">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
