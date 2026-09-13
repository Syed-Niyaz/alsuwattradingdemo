'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import Link from 'next/link'
import { useLang } from '@/context/lang-context'
import { useQuotations } from '@/context/quotation-context'

function getStatusStyle(status: string) {
  switch (status) {
    case 'Admin Accepted':      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'Quotation Generated': return 'bg-blue-50 text-blue-700'
    case 'Pending Approval':    return 'bg-amber-50 text-amber-700'
    case 'Quotation Sent':      return 'bg-indigo-50 text-indigo-700'
    case 'Completed':           return 'bg-emerald-50 text-emerald-700'
    case 'Rejected':            return 'bg-red-50 text-red-700'
    default:                    return 'bg-slate-100 text-slate-600'
  }
}

function getStatusLabel(status: string) {
  if (status === 'Admin Accepted') return 'Quotation Generated · Admin Accepted'
  return status
}

export default function AdminQuotationsPage() {
  const { isRtl } = useLang()
  const { quotations } = useQuotations()
  const [activeTab, setActiveTab] = useState('all')

  const pendingCount = quotations.filter(q => q.status === 'Pending Approval').length

  const TABS = [
    { key: 'all',       label: `All (${quotations.length})` },
    { key: 'pending',   label: `Pending Approval (${pendingCount})` },
    { key: 'generated', label: `Generated (${quotations.filter(q => q.status === 'Quotation Generated' || q.status === 'Admin Accepted').length})` },
    { key: 'sent',      label: `Sent (${quotations.filter(q => q.status === 'Quotation Sent').length})` },
    { key: 'completed', label: `Completed (${quotations.filter(q => q.status === 'Completed').length})` },
  ]

  const filteredQuotations = quotations.filter(q => {
    if (activeTab === 'all')       return true
    if (activeTab === 'pending')   return q.status === 'Pending Approval'
    if (activeTab === 'generated') return q.status === 'Quotation Generated' || q.status === 'Admin Accepted'
    if (activeTab === 'sent')      return q.status === 'Quotation Sent'
    if (activeTab === 'completed') return q.status === 'Completed'
    return true
  })

  return (
    <div className="space-y-6 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">All Quotations</h2>
        <p className="text-sm text-slate-500 mt-1">
          {quotations.length} total quotations
          {pendingCount > 0 && <span className="text-amber-600 font-medium"> · {pendingCount} need your attention</span>}
        </p>
      </div>

      <Card className="border-none shadow-sm shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        
        <div className="border-b border-slate-100 dark:border-slate-800 px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4 text-start">Quotation ID</th>
                <th className="px-6 py-4 text-start">Customer</th>
                <th className="px-6 py-4 text-start">Salesperson</th>
                <th className="px-6 py-4 text-start">Date</th>
                <th className="px-6 py-4 text-center">Discount</th>
                <th className="px-6 py-4 text-end">Value</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No quotations in this category.
                  </td>
                </tr>
              ) : filteredQuotations.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-blue-600">{q.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{q.customerName}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{q.salesperson}</td>
                  <td className="px-6 py-4 text-slate-500">{q.date}</td>
                  <td className="px-6 py-4 text-center font-medium text-amber-600">{q.discount > 0 ? `${q.discount}%` : '-'}</td>
                  <td className="px-6 py-4 text-end font-semibold text-slate-800 dark:text-slate-200">SAR {q.grandTotal.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(q.status)}`}>
                      {getStatusLabel(q.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <Link href={`/admin/quotations/${q.id}`}>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg">
                          <Eye className="w-4 h-4" />
                       </Button>
                     </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
