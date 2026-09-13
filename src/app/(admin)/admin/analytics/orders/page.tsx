'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useQuotations } from '@/context/quotation-context'

export default function AnalyticsOrdersPage() {
  const { quotations } = useQuotations()

  const completedOrders = quotations.filter(q => q.status === 'Completed')

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center text-xs text-slate-500 mb-2 font-medium">
          <Link href="/admin" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 dark:text-slate-200">Completed Orders</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Completed Orders</h2>
            <p className="text-muted-foreground">
              {completedOrders.length} completed quotation{completedOrders.length !== 1 ? 's' : ''} — total SAR {completedOrders.reduce((s, q) => s + q.grandTotal, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <th className="px-6 py-4 text-start">Quotation ID</th>
                <th className="px-6 py-4 text-start">Customer</th>
                <th className="px-6 py-4 text-start">Salesperson</th>
                <th className="px-6 py-4 text-start">Date</th>
                <th className="px-6 py-4 text-end">Value</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {completedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No completed orders yet.
                  </td>
                </tr>
              ) : completedOrders.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-blue-600">{q.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{q.customerName}</td>
                  <td className="px-6 py-4 text-slate-500">{q.salesperson}</td>
                  <td className="px-6 py-4 text-slate-500">{q.date}</td>
                  <td className="px-6 py-4 text-end font-bold text-slate-800 dark:text-slate-200">SAR {q.grandTotal.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <Link href={`/admin/quotations/${q.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50">View Details</Button>
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
