'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useLang } from '@/context/lang-context'
import { useCustomers } from '@/context/customer-context'
import { useQuotations } from '@/context/quotation-context'

export default function CustomersPage() {
  const { lang, isRtl } = useLang()
  const { customers } = useCustomers()
  const { quotations } = useQuotations()
  const ar = lang === 'ar'
  const [search, setSearch] = useState('')

  const filtered = customers.filter(c =>
    (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
    (c.nameAr && c.nameAr.includes(search)) ||
    (c.contact_person && c.contact_person.toLowerCase().includes(search.toLowerCase())) ||
    (c.mobile_no && c.mobile_no.includes(search))
  )

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{ar ? 'العملاء' : 'Customers'}</h2>
          <p className="text-muted-foreground">
            {ar ? `${filtered.length} عميل في منطقتك` : `${filtered.length} customers in your territory`}
          </p>
        </div>
        <Link href="/customers/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 me-2" />
            {ar ? 'عميل جديد' : 'New Customer'}
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
        <Input
          type="search"
          placeholder={ar ? 'بحث بالاسم أو الجوال...' : 'Search by company, contact, or phone...'}
          className={isRtl ? 'pr-9' : 'pl-9'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-start">
          <thead>
            <tr className="border-b bg-slate-50/50 dark:bg-slate-900/50">
              <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500 text-start">
                {ar ? 'الشركة' : 'Company'}
              </th>
              <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500 text-start">
                {ar ? 'جهة الاتصال' : 'Contact Person'}
              </th>
              <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500 text-start">
                {ar ? 'الجوال' : 'Phone'}
              </th>
              <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500 text-start">
                {ar ? 'البريد' : 'Email'}
              </th>
              <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500 text-center">
                {ar ? 'الطلبات' : 'Orders'}
              </th>
              <th className="px-6 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    {ar ? 'لم يتم العثور على عملاء.' : 'No customers found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{ar ? c.nameAr : c.name}</td>
                    <td className="px-6 py-4 text-slate-600">{c.contact_person}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs" dir="ltr">{c.mobile_no}</td>
                    <td className="px-6 py-4 text-blue-600 hover:underline">{c.email}</td>
                    <td className="px-6 py-4 text-center">{quotations.filter(q => q.customerName === c.name).length}</td>
                    <td className="px-6 py-4 text-end">
                      <Link href={`/customers/${c.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs">{ar ? 'عرض' : 'View'}</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
        </table>
      </div>
    </div>
  )
}
