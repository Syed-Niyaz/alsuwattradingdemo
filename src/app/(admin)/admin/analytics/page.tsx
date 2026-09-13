'use client'

import { useState, useMemo } from 'react'
import { useQuotations, Quotation } from '@/context/quotation-context'
import { BarChart3, FileText, Clock, CheckCircle2, Send, XCircle, TrendingUp, ChevronRight, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// ─── helpers ──────────────────────────────────────────────────────────────────

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

function parseDate(d: string): Date {
  if (!d) return new Date(0)
  const parsed = new Date(d)
  return isNaN(parsed.getTime()) ? new Date(0) : parsed
}

function getPeriodKey(date: Date, period: Period): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  if (period === 'daily') return `${y}-${m}-${day}`
  if (period === 'weekly') {
    // ISO week number
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7)
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
  }
  if (period === 'monthly') return `${y}-${m}`
  return `${y}`
}

function formatPeriodLabel(key: string, period: Period): string {
  if (period === 'daily') {
    const d = new Date(key)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (period === 'weekly') return key.replace('-', ' ')
  if (period === 'monthly') {
    const [y, m] = key.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  return key
}

function groupByPeriod(quotations: Quotation[], period: Period) {
  const map: Record<string, { count: number; value: number }> = {}
  quotations.forEach(q => {
    const key = getPeriodKey(parseDate(q.date), period)
    if (!map[key]) map[key] = { count: 0, value: 0 }
    map[key].count++
    map[key].value += q.grandTotal || 0
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12) // show last 12 periods max
}

const STATUS_CONFIG = [
  {
    key: 'Quotation Generated',
    slug: 'generated',
    label: 'Generated',
    icon: FileText,
    from: 'from-blue-500',
    to: 'to-blue-700',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    ring: 'ring-blue-400/30',
    bar: 'bg-blue-500',
  },
  {
    key: 'Pending Approval',
    slug: 'pending',
    label: 'Pending Approval',
    icon: Clock,
    from: 'from-amber-400',
    to: 'to-orange-500',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    ring: 'ring-amber-400/30',
    bar: 'bg-amber-500',
  },
  {
    key: 'Admin Accepted',
    slug: 'accepted',
    label: 'Admin Accepted',
    icon: CheckCircle2,
    from: 'from-emerald-400',
    to: 'to-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ring: 'ring-emerald-400/30',
    bar: 'bg-emerald-400',
  },
  {
    key: 'Quotation Sent',
    slug: 'sent',
    label: 'Sent',
    icon: Send,
    from: 'from-indigo-500',
    to: 'to-indigo-700',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    ring: 'ring-indigo-400/30',
    bar: 'bg-indigo-500',
  },
  {
    key: 'Completed',
    slug: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    from: 'from-emerald-500',
    to: 'to-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    ring: 'ring-emerald-500/30',
    bar: 'bg-emerald-600',
  },
  {
    key: 'Rejected',
    slug: 'rejected',
    label: 'Rejected',
    icon: XCircle,
    from: 'from-red-400',
    to: 'to-red-600',
    badge: 'bg-red-100 text-red-700 border-red-200',
    ring: 'ring-red-400/30',
    bar: 'bg-red-500',
  },
]

function fmt(v: number) {
  if (v >= 1_000_000) return `SAR ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `SAR ${(v / 1_000).toFixed(1)}K`
  return `SAR ${v.toFixed(0)}`
}

// ─── component ────────────────────────────────────────────────────────────────

export default function AnalyticsHubPage() {
  const { quotations } = useQuotations()
  const [period, setPeriod] = useState<Period>('monthly')

  const totalValue = quotations.reduce((s, q) => s + (q.grandTotal || 0), 0)

  // Overall chart buckets
  const overallBuckets = useMemo(() => groupByPeriod(quotations, period), [quotations, period])
  const maxVal = Math.max(...overallBuckets.map(b => b[1].value), 1)

  // Per-status summary
  const statusSummary = useMemo(() =>
    STATUS_CONFIG.map(cfg => {
      const qs = quotations.filter(q => q.status === cfg.key)
      return {
        ...cfg,
        count: qs.length,
        value: qs.reduce((s, q) => s + (q.grandTotal || 0), 0),
      }
    }),
    [quotations]
  )

  // Salesperson leaderboard
  const leaderboard = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {}
    quotations.forEach(q => {
      const n = q.salesperson || 'Unknown'
      if (!map[n]) map[n] = { count: 0, value: 0 }
      map[n].count++
      map[n].value += q.grandTotal || 0
    })
    return Object.entries(map).sort((a, b) => b[1].value - a[1].value).slice(0, 5)
  }, [quotations])

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
  ]

  return (
    <div className="space-y-7 pb-28">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <button className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
              <Link href="/admin" className="hover:text-blue-500 transition-colors">Dashboard</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Analytics</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Quotation Analytics</h2>
            <p className="text-sm text-slate-500 mt-0.5">{quotations.length} total quotations · {fmt(totalValue)} total value</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === p.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overall Value Chart ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Value Over Time</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {period.charAt(0).toUpperCase() + period.slice(1)} view · last {overallBuckets.length} periods
          </span>
        </div>
        <div className="p-6">
          {overallBuckets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <BarChart3 className="w-8 h-8 opacity-30 mb-2" />
              <p className="text-sm">No quotations yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Chart bars */}
              <div className="flex items-end gap-1.5 h-40">
                {overallBuckets.map(([key, data]) => {
                  const pct = Math.max((data.value / maxVal) * 100, 2)
                  return (
                    <div key={key} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full relative flex flex-col items-center justify-end" style={{ height: '120px' }}>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500 shadow-sm group-hover:from-blue-700 group-hover:to-blue-500"
                          style={{ height: `${pct}%`, minHeight: 4 }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {fmt(data.value)}<br />
                          <span className="text-slate-400 font-normal">{data.count} quot.</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium text-center leading-tight">
                        {formatPeriodLabel(key, period)}
                      </span>
                    </div>
                  )
                })}
              </div>
              {/* Summary row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <span>{overallBuckets.reduce((s, b) => s + b[1].count, 0)} quotations shown</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{fmt(overallBuckets.reduce((s, b) => s + b[1].value, 0))} total</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Status Cards ── */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">By Status — tap to drill down</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statusSummary.map(s => {
            const Icon = s.icon
            return (
              <Link key={s.slug} href={`/admin/analytics/status/${s.slug}`}>
                <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 hover:shadow-md hover:ring-2 ${s.ring} transition-all cursor-pointer group`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{s.count}</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.badge}`}>{fmt(s.value)}</span>
                    <span className="text-[10px] text-slate-400">View history →</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Salesperson Leaderboard + Value By Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Salesperson Leaderboard */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Top Salespeople</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {leaderboard.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">No data yet.</div>
            ) : leaderboard.map(([name, data], i) => {
              const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              const gradients = ['from-blue-500 to-blue-700', 'from-indigo-500 to-indigo-700', 'from-violet-500 to-violet-700', 'from-slate-400 to-slate-600', 'from-slate-400 to-slate-600']
              const maxV = leaderboard[0][1].value || 1
              const pct = (data.value / maxV) * 100
              return (
                <div key={name} className="px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradients[i]} flex items-center justify-center text-white text-[11px] font-black shrink-0`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{name}</p>
                        <p className="font-black text-emerald-600 text-sm">{fmt(data.value)}</p>
                      </div>
                      <p className="text-[11px] text-slate-400">{data.count} quotations</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${gradients[i]} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Value by Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Value by Status</h3>
          </div>
          <div className="p-5 space-y-3">
            {statusSummary.map(s => {
              const pct = totalValue > 0 ? (s.value / totalValue) * 100 : 0
              return (
                <div key={s.slug}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{s.label}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{fmt(s.value)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${s.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
