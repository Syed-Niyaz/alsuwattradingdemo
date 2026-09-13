'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, ChevronRight, FileText, Info, Send, User, Check, Eye, Trash2, ExternalLink, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useQuotations } from '@/context/quotation-context'
import { useNotifications } from '@/context/notification-context'

const MOCK_QUOTATION_STATUSES: Record<string, string> = {
  'QT-1005': 'Pending Approval',
  'QT-1008': 'Pending Approval',
  'QT-2024-0047': 'Quotation Generated',
  'QT-2024-0046': 'Pending Approval',
  'QT-2024-0045': 'Quotation Sent',
  'QT-2024-0044': 'Completed',
  'QT-2024-0043': 'Completed',
  'QT-2024-0042': 'Completed',
  'QT-2024-0041': 'Quotation Generated',
  'QT-2024-0040': 'Pending Approval',
  'QT-2024-0039': 'Quotation Sent',
  'QT-2024-0038': 'Quotation Generated',
}

export default function QuotationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = resolvedParams?.id || 'QT-2026-0046'
  const { quotations, updateStatus, deleteQuotation } = useQuotations()
  const { addNotification } = useNotifications()

  // Find this quotation in the global context
  const ctxQuotation = quotations.find(q => q.id === id)

  // Local UI state (for sent/completed timestamps)
  const [completedTime, setCompletedTime] = useState<string | null>(null)
  const [sentTime, setSentTime] = useState<string | null>(null)

  // Derive status from context (reactive)
  const status = ctxQuotation?.status ?? 'Quotation Generated'

  // Build display data: use context data when available, fall back to static placeholder
  const quotationData = {
    id: id,
    customer: {
      name: ctxQuotation?.customerName ?? 'Al Muhaidib Kitchens',
      contact: 'Khalid Al Muhaidib',
      mobile_no: '+966 13 812 3456',
      email: 'khalid@almuhaidib.com.sa',
      address: 'King Fahd Road, Al Khobar 31952',
    },
    date: ctxQuotation?.date ?? '18 Dec 2026',
    salesperson: ctxQuotation?.salesperson ?? 'Ahmad Al Rashid',
    discount: ctxQuotation?.discount ?? 0,
    subtotal: (ctxQuotation?.grandTotal ?? 143.75) / 1.15,
    vat: ((ctxQuotation?.grandTotal ?? 143.75) / 1.15) * 0.15,
    grandTotal: ctxQuotation?.grandTotal ?? 143.75,
    remarks: ctxQuotation?.remarks ?? '',
    items: ctxQuotation?.items ?? [
      { id: 1, name: 'Dinner Plate 11" (White)', sku: 'DP-110', qty: 2, price: 12.50, amount: 25.00 },
      { id: 2, name: 'Dinner Plate 11" (Black)', sku: 'DP-110', qty: 1, price: 12.50, amount: 12.50 },
      { id: 3, name: 'Dinner Plate 11" (Blue)', sku: 'DP-110', qty: 3, price: 12.50, amount: 37.50 },
      { id: 4, name: 'Deep Plate 9" (White)', sku: 'DP-090', qty: 5, price: 10.00, amount: 50.00 },
    ]
  }

  const handleOpenDocument = () => {
    // Save quotation data to sessionStorage for document page
    const docData = {
      ...quotationData,
      status: status
    }
    sessionStorage.setItem('quotation_data', JSON.stringify(docData))
    router.push('/quotations/document')
  }

  const handleSendWhatsApp = () => {
    const phone = quotationData.customer.mobile_no.replace(/\D/g, '')
    const message = encodeURIComponent(
      `Hello ${quotationData.customer.name},\n\nPlease find your quotation *${id}* attached.\nTotal: SAR ${quotationData.grandTotal.toFixed(2)}\n\nThank you for your business!`
    )
    const waUrl = `https://wa.me/${phone}?text=${message}`
    window.open(waUrl, '_blank')

    const newStatus = status === 'Completed' ? 'Completed' : 'Quotation Sent'
    updateStatus(id, newStatus)
    setSentTime('Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
  }

  const handleMarkCompleted = () => {
    if (status === 'Completed') {
      updateStatus(id, 'Quotation Generated')
      setCompletedTime(null)
    } else {
      updateStatus(id, 'Completed')
      setCompletedTime('Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      addNotification({
        type: 'quotation_completed',
        targetRole: 'salesperson',
        title: 'Quotation Completed',
        message: `Quotation ${id} for ${quotationData.customer.name} was marked as Completed.`,
        quotationId: id,
        customerName: quotationData.customer.name,
        salespersonName: quotationData.salesperson,
        link: '/quotations',
      })
    }
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete quotation ${id}? This action cannot be undone.`)) {
      deleteQuotation(id)
      router.push('/admin/quotations')
    }
  }

  const handleApprove = () => {
    updateStatus(id, 'Admin Accepted')
    addNotification({
      type: 'quotation_approved',
      targetRole: 'salesperson',
      title: 'Quotation Approved',
      message: `Admin approved quotation ${id} for ${quotationData.customer.name} (Discount: ${quotationData.discount}%).`,
      quotationId: id,
      customerName: quotationData.customer.name,
      salespersonName: quotationData.salesperson,
      link: '/quotations',
    })
  }

  const handleReject = () => {
    updateStatus(id, 'Rejected')
    addNotification({
      type: 'quotation_rejected',
      targetRole: 'salesperson',
      title: 'Quotation Rejected',
      message: `Admin rejected quotation ${id} for ${quotationData.customer.name}.`,
      quotationId: id,
      customerName: quotationData.customer.name,
      salespersonName: quotationData.salesperson,
      link: '/quotations',
    })
  }

  const isCompleted = status === 'Completed'
  const isSent = status === 'Quotation Sent' || isCompleted
  const isPending = status === 'Pending Approval'
  const isRejected = status === 'Rejected'
  const isAdminAccepted = status === 'Admin Accepted'

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Breadcrumbs & Header */}
      <div>
        <div className="flex items-center text-xs text-slate-500 mb-2 font-medium">
          <Link href="/admin/quotations" className="hover:text-blue-600 transition-colors">Quotations</Link>
          <ChevronRight className="w-3 h-3 mx-2" />
          <span className="text-slate-800 dark:text-slate-200">{id}</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Quotation Details</h2>
            <div className="mt-3">
              {isPending ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                  Pending Approval
                </span>
              ) : isRejected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  Rejected
                </span>
              ) : isAdminAccepted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Quotation Generated · Admin Accepted
                </span>
              ) : isCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Completed (Reviewed & Processed)
                </span>
              ) : isSent ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  Quotation Sent
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  Quotation Generated
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={handleOpenDocument}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all"
            >
              <Eye className="w-4 h-4 mr-2" /> View Quotation
            </Button>
            
            {isPending ? (
              <>
                <Button 
                  onClick={handleApprove}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm border-0 transition-all"
                >
                  <Check className="w-4 h-4 mr-2" /> Accept
                </Button>
                <Button 
                  onClick={handleReject}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm border-0 transition-all"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
              </>
            ) : isRejected ? (
              <></>
            ) : (
              <>
                <Button 
                  onClick={handleSendWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm border-0 transition-all"
                >
                  <Send className="w-4 h-4 mr-2" /> Send WhatsApp
                </Button>
                
                <Button 
                  onClick={handleMarkCompleted}
                  variant={isCompleted ? "default" : "outline"}
                  className={`font-semibold shadow-sm transition-all ${
                    isCompleted 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500 ring-offset-2' 
                      : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 hover:border-emerald-500'
                  }`}
                >
                  <Check className="w-4 h-4 mr-2" /> 
                  {isCompleted ? 'Completed ✓ (Click to Undo)' : 'Mark Completed'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Cards: Info & Customer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quotation Info */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Quotation Info</h3>
          </div>
          <CardContent className="p-5 bg-white space-y-4">
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quotation ID</p>
                <p className="font-semibold text-slate-800">{id}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                <p className="font-semibold text-slate-800">{quotationData.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Salesperson</p>
                <p className="font-semibold text-slate-800">{quotationData.salesperson}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Discount</p>
                <p className="font-semibold text-slate-800">None</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</p>
                <p className="font-semibold text-slate-800">{quotationData.remarks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Customer</h3>
          </div>
          <CardContent className="p-5 bg-white space-y-4">
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company</p>
                <p className="font-semibold text-slate-800">{quotationData.customer.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Person</p>
                <p className="font-semibold text-slate-800">{quotationData.customer.contact}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                <p className="font-semibold text-slate-800">{quotationData.customer.mobile_no}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <p className="font-semibold text-blue-600 hover:underline cursor-pointer">{quotationData.customer.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                <p className="font-semibold text-slate-800">{quotationData.customer.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">Quotation Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <th className="px-5 py-3 text-start w-12">#</th>
                <th className="px-5 py-3 text-start">Product</th>
                <th className="px-5 py-3 text-end">Qty</th>
                <th className="px-5 py-3 text-end">Unit Price</th>
                <th className="px-5 py-3 text-center">Discount</th>
                <th className="px-5 py-3 text-end">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {quotationData.items.map((item: any, idx: number) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-slate-500 font-medium">{item.id || (idx + 1)}</td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-800 text-[13px]">{item.product?.name_en || item.name || 'Product Item'} {item.color ? `(${item.color})` : ''}</p>
                    <p className="text-[11px] text-slate-400">{item.product?.sku || item.sku || 'SKU'}</p>
                  </td>
                  <td className="px-5 py-3 text-end font-semibold text-slate-700">{item.qty || 1}</td>
                  <td className="px-5 py-3 text-end text-slate-600">SAR {Number(item.price || item.product?.price || 0).toFixed(2)}</td>
                  <td className="px-5 py-3 text-center text-slate-400">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                  <td className="px-5 py-3 text-end font-bold text-slate-900">SAR {Number(item.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Totals */}
        <div className="bg-slate-50/50 p-5 border-t border-slate-100 flex flex-col items-end gap-2 text-sm">
          <div className="flex justify-between w-64 text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-800">SAR {quotationData.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-64 text-slate-600">
            <span>VAT (15%)</span>
            <span className="font-semibold text-slate-800">SAR {quotationData.vat.toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-64 pt-2 mt-2 border-t border-slate-200">
            <span className="font-bold text-slate-900">Grand Total</span>
            <span className="font-black text-slate-900">SAR {quotationData.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Bottom Cards: Flow & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status Flow */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Status Flow</h3>
          </div>
          <CardContent className="p-6">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {[
                  { label: 'Draft', stepStatus: 'completed' },
                  { 
                    label: 'Quotation Generated', 
                    stepStatus: isSent || isCompleted ? 'completed' : 'current' 
                  },
                  { 
                    label: 'Quotation Sent', 
                    stepStatus: isCompleted ? 'completed' : isSent ? 'current' : 'pending' 
                  },
                  { 
                    label: 'Completed', 
                    stepStatus: isCompleted ? 'completed' : 'pending' 
                  },
                ].map((step, idx) => (
                  <div key={idx} className="relative flex items-center gap-4">
                    <div className="flex items-center justify-center w-4 h-4 shrink-0 bg-white">
                      {step.stepStatus === 'completed' ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                      ) : step.stepStatus === 'current' ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center ring-4 ring-blue-50">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-200 bg-white" />
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${
                      step.stepStatus === 'completed' ? 'text-emerald-600' :
                      step.stepStatus === 'current' ? 'text-blue-700' :
                      'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Timeline</h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              
              {/* Draft */}
              <div className="relative pl-8">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-white">
                  <Check className="w-3 h-3" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Draft Created</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">18 Dec 2024, 09:14 AM</p>
                <p className="text-xs text-slate-500 mt-1">Quotation draft created by salesperson</p>
              </div>

              {/* Generated */}
              <div className="relative pl-8">
                <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${isSent || isCompleted ? 'bg-emerald-500' : 'bg-blue-600'} border-4 border-white flex items-center justify-center text-white`}>
                  <FileText className="w-3 h-3" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Quotation Generated</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">18 Dec 2024, 09:15 AM</p>
                <p className="text-xs text-slate-500 mt-1">Quotation generated and ready to send</p>
              </div>

              {/* Sent */}
              <div className={`relative pl-8 ${isSent || isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${isSent || isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'} border-4 border-white flex items-center justify-center`}>
                  <Send className="w-3 h-3" />
                </div>
                <h4 className={`font-bold text-sm ${isSent || isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>Quotation Sent</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {sentTime || (isSent ? 'Sent via WhatsApp' : 'Pending')}
                </p>
                <p className={`text-xs mt-1 ${isSent || isCompleted ? 'text-slate-500' : 'text-slate-400'}`}>
                  Quotation sent to customer via WhatsApp
                </p>
              </div>

              {/* Completed */}
              <div className={`relative pl-8 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${isCompleted ? 'bg-emerald-600 text-white ring-2 ring-emerald-200' : 'bg-slate-200 text-slate-400'} border-4 border-white flex items-center justify-center`}>
                  <Check className="w-3 h-3" />
                </div>
                <h4 className={`font-bold text-sm ${isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>Completed</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {completedTime || (isCompleted ? 'Order delivered and closed' : 'Pending')}
                </p>
                <p className={`text-xs mt-1 ${isCompleted ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  Quotation read, processed & completed
                </p>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
      
      {/* Danger Zone */}
      <div className="mt-12 pt-6 border-t border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-red-600 font-bold text-sm">Danger Zone</h4>
          <p className="text-slate-500 text-xs mt-1">Permanently delete this quotation and all its data. This action cannot be undone.</p>
        </div>
        <Button 
          onClick={handleDelete}
          variant="outline" 
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold shadow-sm w-fit"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete Quotation
        </Button>
      </div>
    </div>
  )
}
