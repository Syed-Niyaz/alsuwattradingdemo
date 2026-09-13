'use client'

import { FileText, Users, Package2, CheckCircle, AlertTriangle, XCircle, TrendingUp, ArrowRight, Clock, Star, Zap, BarChart3, ShoppingBag, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import { useLang } from '@/context/lang-context'
import { useQuotations } from '@/context/quotation-context'
import { useProducts } from '@/context/product-context'

export default function DashboardPage() {
  const { lang, isRtl } = useLang()
  const { quotations } = useQuotations()
  const { products } = useProducts()
  const ar = lang === 'ar'

  // Live stock counts from product context
  const totalProducts = products.length
  const inStockCount = products.filter(p => p.variants.reduce((s, v) => s + v.stock, 0) >= 10).length
  const lowStockCount = products.filter(p => { const t = p.variants.reduce((s, v) => s + v.stock, 0); return t > 0 && t < 10 }).length
  const outOfStockCount = products.filter(p => p.variants.reduce((s, v) => s + v.stock, 0) === 0).length

  const today = new Date().toLocaleDateString(ar ? 'ar-SA' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const totalQuotations = quotations.length
  const approvedQuotations = quotations.filter(q => q.status === 'Admin Accepted').length
  const pendingApprovals = quotations.filter(q => q.status === 'Pending Approval').length
  const completedQuotations = quotations.filter(q => q.status === 'Completed').length

  const approvalRate = totalQuotations > 0 ? Math.round((approvedQuotations / totalQuotations) * 100) : 0

  const kpiCards = [
    {
      title: ar ? 'إجمالي العروض' : 'Total Quotations',
      value: totalQuotations.toString(), sub: ar ? 'جميع عروض الأسعار' : 'All created quotations',
      trendVal: '+0%', icon: FileText,
      bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', href: '/quotations?tab=All',
    },
    {
      title: ar ? 'العروض المعتمدة' : 'Approved Quotations',
      value: approvedQuotations.toString(), sub: ar ? `نسبة الاعتماد ${approvalRate}٪` : `${approvalRate}% approval rate`,
      trendVal: '+0%', icon: ThumbsUp,
      bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', href: '/quotations?tab=Approved',
    },
    {
      title: ar ? 'بانتظار الاعتماد' : 'Pending Approvals',
      value: pendingApprovals.toString(), sub: ar ? 'يتطلب موافقة الإدارة' : 'Requires admin action',
      trendVal: ar ? 'عاجل' : 'Urgent', icon: Clock,
      bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', href: '/quotations?tab=Pending+Approval',
    },
    {
      title: ar ? 'الطلبات المكتملة' : 'Completed',
      value: completedQuotations.toString(), sub: ar ? 'عروض أسعار مكتملة' : 'Quotations completed',
      trendVal: '+0%', icon: CheckCircle,
      bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600', href: '/quotations?tab=Completed',
    },
  ]

  // Group top customers dynamically
  const customerMap: Record<string, { orders: number, value: number }> = {}
  quotations.forEach(q => {
    const custName = q.customerName || 'Unknown Customer'
    if (!customerMap[custName]) customerMap[custName] = { orders: 0, value: 0 }
    customerMap[custName].orders += 1
    customerMap[custName].value += (q.grandTotal || 0)
  })
  
  const topCustomers = Object.entries(customerMap)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 4)
    .map(([name, data]) => ({ name: { en: name, ar: name }, orders: data.orders, value: data.value }))

  const recentQuotes = quotations.slice(0, 5)

  const stockItems = [
    { label: ar ? 'إجمالي المنتجات' : 'Total Products', value: totalProducts, icon: Package2, color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600', bar: 100, barColor: 'bg-sky-500' },
    { label: ar ? 'متوفر في المخزون' : 'In Stock', value: inStockCount, icon: CheckCircle, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600', bar: totalProducts > 0 ? Math.round(inStockCount / totalProducts * 100) : 0, barColor: 'bg-emerald-500' },
    { label: ar ? 'مخزون منخفض' : 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600', bar: totalProducts > 0 ? Math.round(lowStockCount / totalProducts * 100) : 0, barColor: 'bg-amber-500' },
    { label: ar ? 'نفذ من المخزون' : 'Out of Stock', value: outOfStockCount, icon: XCircle, color: 'bg-red-100 dark:bg-red-900/30 text-red-600', bar: totalProducts > 0 ? Math.round(outOfStockCount / totalProducts * 100) : 0, barColor: 'bg-red-500' },
  ]

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700'
      case 'Pending Approval': return 'bg-orange-100 text-orange-700'
      case 'Generated': return 'bg-blue-100 text-blue-700'
      case 'Sent': return 'bg-green-100 text-green-700'
      case 'Completed': return 'bg-slate-100 text-slate-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="space-y-8 pb-10" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-2xl px-8 py-8 overflow-hidden shadow-xl">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 right-32 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">{today}</p>
            <h1 className="text-3xl font-bold text-white">
              {ar ? 'مرحباً بعودتك، أحمد 👋' : 'Welcome back, Ahmad 👋'}
            </h1>
            <p className="text-blue-200 mt-1.5 text-sm">
              {ar ? 'إليك آخر مستجدات مبيعاتك اليوم.' : "Here's what's happening with your sales today."}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/quotations/new">
              <button className="flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-all shadow-lg">
                <Zap className="w-4 h-4" /> {ar ? 'عرض سعر جديد' : 'New Quotation'}
              </button>
            </Link>
            <Link href="/customers">
              <button className="flex items-center gap-2 bg-white/10 text-white border border-white/20 font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-white/20 transition-all">
                <Users className="w-4 h-4" /> {ar ? 'العملاء' : 'Customers'}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiCards.map((card) => (
          <Link href={card.href} key={card.title}>
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group cursor-pointer">
              <div className="flex items-start justify-between mb-5">
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <card.icon className={`w-6 h-6 ${card.text}`} />
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" /> {card.trendVal}
                </span>
              </div>
              <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-1">{card.value}</div>
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">{card.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{card.sub}</div>
              <div className="mt-4 pt-3 border-t dark:border-slate-800 flex items-center justify-between">
                <span className={`text-xs font-medium ${card.text}`}>{ar ? 'عرض التفاصيل' : 'View details'}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${card.text} group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Stock + Top Customers ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Stock */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{ar ? 'ملخص المخزون' : 'Stock Summary'}</h3>
                <p className="text-xs text-slate-400">{ar ? 'نظرة عامة على المخزون' : 'Real-time inventory overview'}</p>
              </div>
            </div>
            <Link href="/products">
              <button className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                {ar ? 'عرض الكل' : 'View All'} <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </Link>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            {stockItems.map((item) => (
              <Link key={item.label} href={`/products/stock?filter=${encodeURIComponent(item.label)}`}>
                <div className="border dark:border-slate-700 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${item.color}`}><item.icon className="w-4 h-4" /></div>
                    <span className="text-2xl font-black text-slate-800 dark:text-white">{item.value}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{item.label}</p>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${item.barColor} rounded-full`} style={{ width: `${item.bar}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{item.bar}{ar ? '٪ من الإجمالي' : '% of total'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <Star className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{ar ? 'أفضل العملاء' : 'Top Customers'}</h3>
                <p className="text-xs text-slate-400">{ar ? 'حسب قيمة الطلبات' : 'By total order value'}</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {topCustomers.map((c, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-slate-600'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{c.name[lang as 'en' | 'ar']}</div>
                  <div className="text-xs text-slate-400">{c.orders} {ar ? 'طلبات' : 'orders'}</div>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">SAR {(c.value / 1000).toFixed(1)}K</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Quotations ── */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{ar ? 'أحدث عروض الأسعار' : 'Recent Quotations'}</h3>
              <p className="text-xs text-slate-400">{ar ? 'أحدث ٥ عروض' : 'Your latest 5 quotations'}</p>
            </div>
          </div>
          <Link href="/quotations">
            <button className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
              {ar ? 'عرض الكل' : 'View All'} <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              <tr className="border-b dark:border-slate-800">
                <th className="px-6 py-3 text-start">{ar ? 'رقم العرض' : 'Quotation ID'}</th>
                <th className="px-6 py-3 text-start">{ar ? 'العميل' : 'Customer'}</th>
                <th className="px-6 py-3 text-start">{ar ? 'التاريخ' : 'Date'}</th>
                <th className="px-6 py-3 text-end">{ar ? 'القيمة' : 'Value'}</th>
                <th className="px-6 py-3 text-start">{ar ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {recentQuotes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {ar ? 'لا توجد عروض أسعار حتى الآن' : 'No quotations generated yet.'}
                  </td>
                </tr>
              ) : recentQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-blue-700">{q.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{q.customerName}</td>
                  <td className="px-6 py-4 text-slate-500">{q.date}</td>
                  <td className="px-6 py-4 text-end font-bold text-slate-800 dark:text-slate-200">SAR {q.grandTotal.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(q.status)}`}>
                      {q.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
