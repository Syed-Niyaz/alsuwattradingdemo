'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText, Search, Plus, Check, X } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { useQuotations } from '@/context/quotation-context'

const STATUS_TABS = ['All', 'Pending Approval', 'Admin Accepted', 'Quotation Generated', 'Quotation Sent', 'Completed', 'Rejected']

function QuotationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { quotations: allQuotations, updateStatus } = useQuotations()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'All')

  // Sync tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  // Rejection modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Normalise context quotations to match the shape expected by this page
  const quotations = allQuotations.map(q => ({
    id: q.id,
    customer: { name: q.customerName },
    date: q.date,
    discount: q.discount,
    grandTotal: q.grandTotal,
    status: q.status,
  }))

  const filteredBySearch = quotations.filter(q =>
    q.id.toLowerCase().includes(search.toLowerCase()) ||
    q.customer?.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredByTab = filteredBySearch.filter(q => {
    if (activeTab === 'All') return true
    if (activeTab === 'Sent') return q.status === 'Sent' || q.status === 'Quotation Sent'
    if (activeTab === 'Completed') return q.status === 'Completed' || q.status === 'Customer Accepted'
    if (activeTab === 'Customer Rejected') return q.status === 'Customer Rejected' || q.status === 'Rejected'
    if (activeTab === 'Generated') return q.status === 'Generated' || q.status === 'Quotation Generated'
    return q.status === activeTab
  })

  const handleViewQuotation = (quotation: any) => {
    // Navigate to document if they click a row
    // (In a real app, you'd fetch the full data by ID. Here we just set session state)
    sessionStorage.setItem('quotation_data', JSON.stringify(quotation))
    router.push('/quotations/document')
  }

  const handleAction = (e: React.MouseEvent, id: string, newStatus: string) => {
    e.stopPropagation()
    updateStatus(id, newStatus)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Approval': return <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">Pending Approval</span>
      case 'Admin Accepted': return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">✓ Admin Accepted</span>
      case 'Quotation Generated':
      case 'Generated': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">Quotation Generated</span>
      case 'Quotation Sent':
      case 'Sent': return <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-semibold">Quotation Sent</span>
      case 'Completed': return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">Completed</span>
      case 'Rejected': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">Rejected</span>
      default: return <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-semibold">{status}</span>
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Quotations</h2>
          <p className="text-muted-foreground text-sm mt-1">Track all your quotations</p>
        </div>
        <Link href="/quotations/new">
          <Button className="bg-[#1e5eb3] hover:bg-blue-700 w-full md:w-auto font-medium shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> New Quotation
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b pt-4 overflow-x-auto no-scrollbar">
        {STATUS_TABS.map(tab => {
          const count = tab === 'All'
            ? quotations.length
            : tab === 'Sent'
              ? quotations.filter(q => q.status === 'Sent' || q.status === 'Quotation Sent').length
              : tab === 'Completed'
                ? quotations.filter(q => q.status === 'Completed' || q.status === 'Customer Accepted').length
                : tab === 'Customer Rejected'
                  ? quotations.filter(q => q.status === 'Customer Rejected' || q.status === 'Rejected').length
                  : tab === 'Generated'
                    ? quotations.filter(q => q.status === 'Generated' || q.status === 'Quotation Generated').length
                    : quotations.filter(q => q.status === tab).length
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${isActive
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab} ({count})
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">QUOTATION ID</th>
                <th className="px-6 py-4">CUSTOMER</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">DISCOUNT</th>
                <th className="px-6 py-4">VALUE</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredByTab.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No quotations found in this status.
                  </td>
                </tr>
              ) : (
                filteredByTab.map((q, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    onClick={() => handleViewQuotation(q)}
                  >
                    <td className="px-6 py-4 font-bold text-blue-700">{q.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{q.customer?.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{q.date}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {q.discount > 0 ? (
                        <span className={q.discount >= 10 ? "text-green-600" : "text-orange-500"}>
                          {q.discount}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      SAR {q.grandTotal?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(q.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {(q.status === 'Sent' || q.status === 'Quotation Sent') ? (
                          <>
                            <button
                              onClick={(e) => handleAction(e, q.id, 'Completed')}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-colors shadow-sm"
                              title="Customer Accepted"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setRejectingId(q.id); setRejectReason(''); }}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors shadow-sm"
                              title="Customer Rejected"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (q.status === 'Customer Rejected' || q.status === 'Rejected') && activeTab === 'Customer Rejected' ? (
                          <div className="text-sm text-red-600">
                            <strong>Reason:</strong> N/A
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRejectingId(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-xl shadow-xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Rejection Reason</h3>
            <p className="text-sm text-slate-500 mb-4">Please provide a short reason for why the customer rejected this quotation.</p>
            <textarea
              className="w-full h-24 p-3 border rounded-lg resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
              placeholder="E.g. Price too high, found a better deal..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  updateStatus(rejectingId, 'Rejected')
                  setRejectingId(null)
                }}
                disabled={!rejectReason.trim()}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MyQuotationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading quotations…</div>}>
      <QuotationsContent />
    </Suspense>
  )
}
