'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, TriangleAlert, DollarSign, CheckCircle2, Package, TrendingUp, Star } from 'lucide-react'
import Link from 'next/link'
import { useLang } from '@/context/lang-context'
import { useQuotations } from '@/context/quotation-context'
import { useProducts } from '@/context/product-context'

const MOCK_RECENT_QUOTATIONS: never[] = []

export default function AdminDashboardPage() {
  const { isRtl } = useLang()
  const { quotations } = useQuotations()
  const { products } = useProducts()

  // Compute live stock summary counts
  const totalProducts = products.length
  const inStockCount = products.filter(p => p.variants.reduce((s, v) => s + v.stock, 0) >= 10).length
  const lowStockCount = products.filter(p => { const t = p.variants.reduce((s, v) => s + v.stock, 0); return t > 0 && t < 10 }).length
  const outOfStockCount = products.filter(p => p.variants.reduce((s, v) => s + v.stock, 0) === 0).length

  // Compute KPIs from live context data
  const pendingCount = quotations.filter(q => q.status === 'Pending Approval').length
  const completedCount = quotations.filter(q => q.status === 'Completed').length
  const totalValue = quotations.filter(q => q.status === 'Completed').reduce((sum, q) => sum + (q.grandTotal || 0), 0)
  const recentQuotations = quotations.slice(0, 5)

  const statusMap = {
    Generated: quotations.filter(q => q.status === 'Quotation Generated').length,
    Pending: pendingCount,
    Sent: quotations.filter(q => q.status === 'Quotation Sent').length,
    Accepted: quotations.filter(q => q.status === 'Admin Accepted').length,
    Completed: completedCount,
  }
  const statusTotal = quotations.length || 1 // Avoid divide by zero

  const salespersonMap: Record<string, { count: number, value: number }> = {}
  quotations.forEach(q => {
    const name = q.salesperson || 'Unknown'
    if (!salespersonMap[name]) salespersonMap[name] = { count: 0, value: 0 }
    salespersonMap[name].count += 1
    salespersonMap[name].value += (q.grandTotal || 0)
  })

  const topSalespeople = Object.entries(salespersonMap)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 3)
    .map(([name, data], idx) => {
      const parts = name.split(' ')
      const initials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2).toUpperCase()
      const gradients = [
        { from: 'from-blue-500', to: 'to-blue-700' },
        { from: 'from-indigo-500', to: 'to-indigo-700' },
        { from: 'from-purple-500', to: 'to-purple-700' }
      ]
      return {
        initials, name, meta: `${data.count} quotations`,
        value: `SAR ${data.value >= 1000 ? (data.value / 1000).toFixed(1) + 'K' : data.value.toFixed(0)}`,
        from: gradients[idx % 3].from, to: gradients[idx % 3].to, rank: idx + 1
      }
    })

  // ── Stock Detail Modal ─────────────────────────────────────────
  type StockFilter = 'all' | 'in' | 'low' | 'out'
  const [stockFilter, setStockFilter] = useState<StockFilter | null>(null)

  const filterLabel: Record<StockFilter, string> = {
    all: 'All Products',
    in: 'Products In Stock',
    low: 'Low Stock',
    out: 'Out of Stock',
  }

  const filteredProducts = products.filter(p => {
    if (!stockFilter) return false
    const total = p.variants.reduce((s, v) => s + v.stock, 0)
    if (stockFilter === 'all') return true
    if (stockFilter === 'in') return total >= 10
    if (stockFilter === 'low') return total > 0 && total < 10
    if (stockFilter === 'out') return total === 0
    return false
  })

  const getVariantStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out', cls: 'bg-red-100 text-red-700 border-red-200' }
    if (stock < 5) return { label: 'Critical', cls: 'bg-orange-100 text-orange-700 border-orange-200' }
    if (stock < 10) return { label: 'Low', cls: 'bg-amber-100 text-amber-700 border-amber-200' }
    return { label: 'OK', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  }

  const getProductStockBadge = (total: number) => {
    if (total === 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-700 border border-red-200' }
    if (total < 10) return { label: 'Low Stock', cls: 'bg-amber-100 text-amber-700 border border-amber-200' }
    return { label: 'In Stock', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' }
  }

  return (
    <div className="space-y-6 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Overview of all operations — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link href="/admin/quotations">
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 rounded-xl px-5">
            <FileText className="w-4 h-4 mr-2" /> View All Quotations
          </Button>
        </Link>
      </div>

      {/* Premium Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Card 1 - Today's Quotations */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Today's Quotations</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{quotations.length}</p>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> +18%
              </span>
              <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
            </div>
          </div>
          <Link href="/admin/quotations">
            <p className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
              View all quotations <span>›</span>
            </p>
          </Link>
        </div>

        {/* Card 2 - Pending Approvals */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200">
              <TriangleAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Pending Approvals</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{pendingCount}</p>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full animate-pulse">
                ● Needs Action
              </span>
              <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
            </div>
          </div>
          <Link href="/admin/approvals">
            <p className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
              Review pending approvals <span>›</span>
            </p>
          </Link>
        </div>

        {/* Card 3 - Quotation Value */}
        <Link href="/admin/analytics/status/completed" className="block group">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all cursor-pointer h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Quotation Value</span>
                  <p className="text-[10px] text-slate-400 font-medium">Completed quotations</p>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  SAR {totalValue >= 1000 ? (totalValue / 1000).toFixed(1) + 'K' : totalValue.toFixed(0)}
                </p>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" /> +24%
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1">
              View completed quotations deep details <span className="group-hover:translate-x-0.5 transition-transform">›</span>
            </p>
          </div>
        </Link>

        {/* Card 4 - Completed Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md shadow-violet-200">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Completed Orders</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{completedCount}</p>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> +8%
              </span>
              <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
            </div>
          </div>
          <Link href="/admin/analytics/orders">
            <p className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
              View completed orders <span>›</span>
            </p>
          </Link>
        </div>

      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Quotations Table */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Recent Quotations</h3>
              <Link href="/admin/quotations">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-semibold">
                  View All
                </Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3 text-start">ID</th>
                    <th className="px-6 py-3 text-start">Customer</th>
                    <th className="px-6 py-3 text-start">Salesperson</th>
                    <th className="px-6 py-3 text-center">Discount</th>
                    <th className="px-6 py-3 text-end">Value</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No recent quotations generated yet.
                      </td>
                    </tr>
                  ) : recentQuotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-600 text-xs">{q.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{q.customerName}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{q.salesperson}</td>
                      <td className="px-6 py-4 text-center">
                        {q.discount > 0 ? (
                          <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-xs">{q.discount}%</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-end font-bold text-slate-800 dark:text-slate-200">SAR {(q.grandTotal || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                          q.status === 'Quotation Generated' ? 'bg-blue-100 text-blue-700' :
                          q.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' :
                          q.status === 'Quotation Sent' ? 'bg-indigo-100 text-indigo-700' :
                          q.status === 'Admin Accepted' ? 'bg-emerald-100 text-emerald-700' :
                          q.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
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

        {/* Right Sidebar Cards */}
        <div className="space-y-5">

          {/* ── Stock Summary (Live) ──────────────────────────────── */}
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Stock Summary</h3>
              </div>
              {/* LIVE indicator */}
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                LIVE
              </span>
            </div>

            <CardContent className="p-3 space-y-1.5">
              {([
                {
                  filter: 'all' as StockFilter,
                  label: 'Total Products',
                  count: totalProducts,
                  dot: 'bg-blue-500',
                  badge: 'text-blue-700 bg-blue-50 border-blue-200',
                  row: 'hover:bg-blue-50/60 dark:hover:bg-blue-900/20',
                  urgent: false,
                },
                {
                  filter: 'in' as StockFilter,
                  label: 'Products In Stock',
                  count: inStockCount,
                  dot: 'bg-emerald-500',
                  badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  row: 'hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20',
                  urgent: false,
                },
                {
                  filter: 'low' as StockFilter,
                  label: 'Low Stock',
                  count: lowStockCount,
                  dot: 'bg-amber-500',
                  badge: 'text-amber-700 bg-amber-50 border-amber-200',
                  row: 'hover:bg-amber-50/60 dark:hover:bg-amber-900/20',
                  urgent: lowStockCount > 0,
                },
                {
                  filter: 'out' as StockFilter,
                  label: 'Out of Stock',
                  count: outOfStockCount,
                  dot: 'bg-red-500',
                  badge: 'text-red-700 bg-red-50 border-red-200',
                  row: 'hover:bg-red-50/60 dark:hover:bg-red-900/20',
                  urgent: outOfStockCount > 0,
                },
              ] as const).map((item) => (
                <button
                  key={item.filter}
                  onClick={() => setStockFilter(item.filter)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${item.row} border border-transparent hover:border-slate-200 dark:hover:border-slate-700`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${item.dot} ${item.urgent ? 'animate-pulse' : ''}`} />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                    {item.urgent && (
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-wide animate-pulse">Alert</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${item.badge}`}>
                      {item.count}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                  </div>
                </button>
              ))}
              <p className="text-[10px] text-slate-400 text-center pt-1">Tap any row to view products</p>
            </CardContent>
          </Card>

          {/* By Status */}
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">By Status</h3>
            </div>
            <CardContent className="p-5 space-y-3.5">
              {[
                { label: 'Generated', count: statusMap.Generated, total: statusTotal, color: 'bg-gradient-to-r from-blue-400 to-blue-600' },
                { label: 'Pending Approval', count: statusMap.Pending, total: statusTotal, color: 'bg-gradient-to-r from-amber-400 to-orange-500' },
                { label: 'Sent', count: statusMap.Sent, total: statusTotal, color: 'bg-gradient-to-r from-indigo-400 to-indigo-600' },
                { label: 'Accepted', count: statusMap.Accepted, total: statusTotal, color: 'bg-gradient-to-r from-purple-400 to-purple-600' },
                { label: 'Completed', count: statusMap.Completed, total: statusTotal, color: 'bg-gradient-to-r from-emerald-400 to-emerald-600' },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{item.label}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${(item.count / item.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Salespeople */}
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Top Salespeople</h3>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {topSalespeople.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-500 text-sm">
                    No salespeople data yet.
                  </div>
                ) : topSalespeople.map((sp, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sp.from} ${sp.to} flex items-center justify-center text-white text-xs font-black shadow-md`}>
                          {sp.initials}
                        </div>
                        {sp.rank === 1 && (
                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow">1</div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{sp.name}</p>
                        <p className="text-xs text-slate-500">{sp.meta}</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-600 text-sm">{sp.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Stock Detail Slide-In Panel ───────────────────────────────── */}
      {stockFilter !== null && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setStockFilter(null)}
          />

          {/* Panel */}
          <div className="relative ml-auto w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">{filterLabel[stockFilter]}</h2>
                  <p className="text-[11px] text-slate-500">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Live badge */}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  LIVE
                </span>
                <button
                  onClick={() => setStockFilter(null)}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Filter chips */}
            <div className="px-5 py-3 flex gap-2 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-x-auto">
              {(['all', 'in', 'low', 'out'] as StockFilter[]).map(f => {
                const chipCfg = {
                  all: { label: 'All', cls: 'bg-blue-600 text-white', idle: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100' },
                  in:  { label: 'In Stock', cls: 'bg-emerald-600 text-white', idle: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
                  low: { label: 'Low Stock', cls: 'bg-amber-500 text-white', idle: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' },
                  out: { label: 'Out of Stock', cls: 'bg-red-600 text-white', idle: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100' },
                }[f]
                return (
                  <button
                    key={f}
                    onClick={() => setStockFilter(f)}
                    className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${stockFilter === f ? chipCfg.cls + ' border-transparent shadow-sm' : chipCfg.idle + ' border'}`}
                  >
                    {chipCfg.label}
                  </button>
                )
              })}
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                  <Package className="w-10 h-10 opacity-30" />
                  <p className="text-sm font-medium">No products in this category</p>
                </div>
              ) : filteredProducts.map(product => {
                const total = product.variants.reduce((s, v) => s + v.stock, 0)
                const badge = getProductStockBadge(total)
                return (
                  <div
                    key={product.id}
                    className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    {/* Product Row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-10 h-10 rounded-xl ${product.image_color} flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600`}>
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{product.name_en}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{product.sku}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{total} units</span>
                      </div>
                    </div>

                    {/* Variant Breakdown */}
                    <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2.5 grid grid-cols-2 gap-1.5">
                      {product.variants.map((v, vi) => {
                        const vs = getVariantStatus(v.stock)
                        return (
                          <div key={vi} className={`flex items-center justify-between px-2 py-1 rounded-lg border ${vs.cls} bg-white dark:bg-slate-900/50`}>
                            <span className="text-[10px] font-semibold truncate max-w-[70px]">{v.color}</span>
                            <span className="text-[10px] font-black ml-1">{v.stock}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <Link href="/admin/products" onClick={() => setStockFilter(null)}>
                <button className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20">
                  Manage All Products →
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
