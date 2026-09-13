'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, FileText, Info } from 'lucide-react'
import { useLang } from '@/context/lang-context'
import { useParams, useRouter } from 'next/navigation'
import { useCustomers } from '@/context/customer-context'
import { useQuotations } from '@/context/quotation-context'

function getStatusStyle(status: string) {
  switch (status) {
    case 'Admin Accepted':      return 'bg-emerald-100 text-emerald-800'
    case 'Quotation Generated': return 'bg-blue-100 text-blue-800'
    case 'Pending Approval':    return 'bg-amber-100 text-amber-800'
    case 'Quotation Sent':      return 'bg-indigo-100 text-indigo-800'
    case 'Completed':           return 'bg-emerald-100 text-emerald-800'
    case 'Rejected':            return 'bg-red-100 text-red-800'
    default:                    return 'bg-slate-100 text-slate-600'
  }
}

export default function CustomerDetailsPage() {
  const { isRtl } = useLang()
  const router = useRouter()
  const params = useParams()
  const { customers } = useCustomers()
  const { quotations } = useQuotations()

  const customer = customers.find(c => c.id === params.id)
  const customerQuotations = customer
    ? quotations.filter(q => q.customerName === customer.name || q.customerName === customer.nameAr)
    : []

  const totalOrders = customerQuotations.length
  const lastVisit = customerQuotations.length > 0 ? customerQuotations[0].date : '—'
  const lastSalesperson = customerQuotations.length > 0 ? customerQuotations[0].salesperson : '—'

  if (!customer) {
    return (
      <div className="space-y-6 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex items-center text-sm">
          <Link href="/admin/customers" className="text-blue-600 hover:underline font-medium">Customers</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-500">Not Found</span>
        </div>
        <Card className="p-12 text-center text-slate-400">Customer not found.</Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Breadcrumb */}
      <div className="flex items-center text-sm">
        <Link href="/admin/customers" className="text-blue-600 hover:underline font-medium">
          Customers
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-500">{customer.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{customer.name}</h2>
        <Button variant="outline" onClick={() => router.back()} className="text-slate-600 bg-slate-50 border-slate-200">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information Card */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">Customer Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Company</p>
              <p className="text-slate-900 font-medium">{customer.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Contact Person</p>
              <p className="text-slate-900 font-medium">{customer.contact_person || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Phone</p>
              <p className="text-slate-900 font-medium">{customer.mobile_no || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Email</p>
              <p className="text-slate-900 font-medium">{customer.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Customer VAT Number</p>
              <p className="text-slate-900 font-medium font-mono">{customer.vat_no || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Customer CR Number</p>
              <p className="text-slate-900 font-medium font-mono">{customer.cr_no || '—'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Address</p>
              <p className="text-slate-900 font-medium">{customer.address || '—'}</p>
            </div>
          </div>
        </Card>

        {/* Summary Card */}
        <Card className="border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">Summary</h3>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Quotations</p>
              <p className="text-3xl font-bold text-slate-900">{totalOrders}</p>
            </div>
            <div className="w-full h-px bg-slate-100"></div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Last Activity</p>
              <p className="text-slate-900 font-medium">{lastVisit}</p>
            </div>
            <div className="w-full h-px bg-slate-100"></div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Last Salesperson</p>
              <p className="text-slate-900 font-medium">{lastSalesperson}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Previous Quotations Card */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">Quotations History</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4 text-start">Quotation ID</th>
                <th className="px-6 py-4 text-start">Salesperson</th>
                <th className="px-6 py-4 text-start">Date</th>
                <th className="px-6 py-4 text-end">Value</th>
                <th className="px-6 py-4 text-center">Discount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerQuotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No quotations found for this customer.
                  </td>
                </tr>
              ) : customerQuotations.map(q => (
                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/quotations/${q.id}`}>
                      <span className="font-bold text-blue-600 hover:underline cursor-pointer">{q.id}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{q.salesperson}</td>
                  <td className="px-6 py-4 text-slate-600">{q.date}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium text-end">SAR {q.grandTotal?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4 text-center text-amber-600 font-medium">{q.discount > 0 ? `${q.discount}%` : '—'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(q.status)}`}>
                      {q.status}
                    </span>
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
