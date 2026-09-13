'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, Plus, Phone, MessageCircle, Building2, UserCircle, 
  Mail, MapPin, FileText, Hash, CheckCircle2, Clock, PackageOpen
} from 'lucide-react'
import { useLang } from '@/context/lang-context'
import { useCustomers } from '@/context/customer-context'
import { useQuotations } from '@/context/quotation-context'

// MOCK DATA for Customer
const CUSTOMER_DATA = {
  id: '1',
  name: 'Al Muhaidib Kitchens',
  nameAr: 'مطابخ المحيدب',
  contact_person: 'Khalid Al Muhaidib',
  mobile_no: '+966 13 812 3456',
  email: 'khalid@almuhaidib.com.sa',
  address: 'King Fahd Road, Al Khobar 31952',
  vat: '310123456700003',
  cr: '1010123456789',
  notes: 'Premium kitchen projects. Net 30 terms.',
  total_orders: 22,
  last_visit: '18 Dec 2026',
  last_salesperson: 'Ahmad Al Rashid',
  lifetime_value: 345000.00
}

const PREVIOUS_QUOTATIONS = [
  { id: 'QT-2026-0047', salesperson: 'Ahmad Al Rashid', date: '18 Dec 2026', value: 312.00, discount: '-', status: 'Quotation Generated' },
  { id: 'QT-2026-0012', salesperson: 'Ahmed Ali', date: '05 Nov 2026', value: 1450.00, discount: '5%', status: 'Customer Accepted' },
]

const COMPLETED_ORDERS = [
  { id: 'ORD-2026-112', date: '12 Oct 2026', items: 4, value: 12500.00, salesperson: 'Ahmad Al Rashid' },
  { id: 'ORD-2026-089', date: '01 Sep 2026', items: 2, value: 4500.00, salesperson: 'Ahmad Al Rashid' },
]

export default function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { lang, isRtl } = useLang()
  const ar = lang === 'ar'

  const { customers } = useCustomers()
  const { quotations } = useQuotations()
  const c = customers.find(cust => cust.id === id) || CUSTOMER_DATA

  const customerQuotations = quotations.filter(q => q.customerName === c.name || q.customerName === c.nameAr)
  const completedOrders = customerQuotations.filter(q => q.status === 'Completed' || q.status === 'Admin Accepted' || q.status === 'Customer Accepted')
  
  const totalOrders = customerQuotations.length
  const lifetimeValue = completedOrders.reduce((sum, q) => sum + q.grandTotal, 0)
  const lastVisit = customerQuotations.length > 0 ? customerQuotations[0].date : '-'
  const lastSalesperson = customerQuotations.length > 0 ? customerQuotations[0].salesperson : '-'

  return (
    <div className="space-y-6 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header and Breadcrumb */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/customers" className="text-blue-600 hover:underline">{ar ? 'العملاء' : 'Customers'}</Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground font-medium">{ar ? c.nameAr : c.name}</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              {ar ? c.nameAr : c.name}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">{c.address}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white hover:bg-slate-50" onClick={() => router.back()}>
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {ar ? 'رجوع' : 'Back'}
            </Button>
            <Link href={`/quotations/new?customer=${c.id}`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                <Plus className="w-4 h-4 mr-2" /> {ar ? 'عرض سعر جديد' : 'New Quotation'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mt-2">
          <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-white">
            <Phone className="w-4 h-4 mr-2" /> {ar ? 'اتصال بالعميل' : 'Call Customer'}
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-500/20">
            <MessageCircle className="w-4 h-4 mr-2" /> {ar ? 'واتساب العميل' : 'WhatsApp Customer'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Customer Info (Takes up 2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-900/80 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
                <UserCircle className="w-5 h-5 text-blue-500" />
                {ar ? 'معلومات العميل' : 'Customer Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Company</div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">{ar ? c.nameAr : c.name}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5" /> Contact Person</div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">{c.contact_person}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</div>
                  <div className="font-medium text-slate-800 dark:text-slate-200" dir="ltr">{c.mobile_no}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</div>
                  <div className="font-medium text-blue-600 dark:text-blue-400">{c.email}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Customer VAT Number</div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 font-mono">{c.vat}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Customer CR Number</div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 font-mono">{c.cr}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">{c.address}</div>
                </div>
                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Notes</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{c.notes}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Orders */}
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                {ar ? 'الطلبات المكتملة' : 'Completed Orders'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {completedOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                        <th className="px-6 py-4 font-semibold text-xs text-slate-500 text-start uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-4 font-semibold text-xs text-slate-500 text-start uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 font-semibold text-xs text-slate-500 text-center uppercase tracking-wider">Items</th>
                        <th className="px-6 py-4 font-semibold text-xs text-slate-500 text-end uppercase tracking-wider">Value</th>
                        <th className="px-6 py-4 font-semibold text-xs text-slate-500 text-start uppercase tracking-wider">Salesperson</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {completedOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-blue-600">{o.id}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{o.date}</td>
                          <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{o.items?.length || 0}</td>
                          <td className="px-6 py-4 text-end font-semibold text-slate-800 dark:text-slate-200">SAR {o.grandTotal?.toFixed(2) || '0.00'}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{o.salesperson?.substring(0,2).toUpperCase() || 'NA'}</div>
                            {o.salesperson}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <PackageOpen className="w-12 h-12 text-slate-200 mb-3" />
                  <p>No completed orders</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous Quotations */}
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
                <FileText className="w-5 h-5 text-indigo-500" />
                {ar ? 'عروض الأسعار السابقة' : 'Previous Quotations'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <th className="px-6 py-4 font-semibold text-xs text-slate-500 text-start uppercase tracking-wider">Quotation ID</th>
                      <th className="px-6 py-4 font-semibold text-xs text-slate-500 text-start uppercase tracking-wider">Salesperson</th>
                      <th className="px-6 py-4 font-semibold text-xs text-slate-500 text-start uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 font-semibold text-xs text-slate-500 text-end uppercase tracking-wider">Value</th>
                      <th className="px-6 py-4 font-semibold text-xs text-slate-500 text-center uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customerQuotations.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-blue-600">{q.id}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{q.salesperson}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{q.date}</td>
                        <td className="px-6 py-4 text-end font-semibold text-slate-800 dark:text-slate-200">SAR {q.grandTotal?.toFixed(2) || '0.00'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            q.status === 'Customer Accepted' || q.status === 'Admin Accepted' || q.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-950">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base text-slate-800 dark:text-slate-100">
                <Clock className="w-5 h-5 text-purple-500" />
                {ar ? 'الملخص' : 'Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Total Orders</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalOrders}</div>
              </div>
              <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Last Visit</div>
                <div className="font-medium text-slate-800 dark:text-slate-200">{lastVisit}</div>
              </div>
              <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Last Salesperson</div>
                <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-1">
                  {lastSalesperson !== '-' && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                      {lastSalesperson.substring(0,2).toUpperCase()}
                    </div>
                  )}
                  {lastSalesperson}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lifetime Value Card */}
          <Card className="border-none shadow-sm rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-normal text-blue-100">
                {ar ? 'القيمة الإجمالية' : 'Lifetime Value'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight mt-2">
                <span className="text-2xl font-normal text-blue-200 mr-1">SAR</span>
                {lifetimeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-blue-200 text-xs mt-3">Total purchase value across all orders</p>
            </CardContent>
          </Card>

          {/* Frequently Purchased */}
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base text-slate-800 dark:text-slate-100">
                <PackageOpen className="w-5 h-5 text-orange-500" />
                {ar ? 'المنتجات المشتراة بكثرة' : 'Frequently Purchased'}
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <PackageOpen className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No purchase history</p>
                  <p className="text-xs text-slate-400 mt-1">Products will appear here after the first order.</p>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
