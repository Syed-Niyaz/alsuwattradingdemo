'use client'

import { useState, useMemo, use } from 'react'
import { useQuotations, Quotation } from '@/context/quotation-context'
import {
  ArrowLeft, BarChart3, Calendar, ChevronRight,
  Eye, FileText, Clock, CheckCircle2, Send, XCircle,
  TrendingUp, Users, Building2, Layers, Sparkles, DollarSign,
  PieChart as PieIcon, LineChart as LineIcon
} from 'lucide-react'
import Link from 'next/link'

// ─── types & config ────────────────────────────────────────────────────────────

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'
type GraphView = 'trend' | 'bars' | 'salesperson' | 'customers'

const SLUG_TO_STATUS: Record<string, string> = {
  generated: 'Quotation Generated',
  pending:   'Pending Approval',
  accepted:  'Admin Accepted',
  sent:      'Quotation Sent',
  completed: 'Completed',
  rejected:  'Rejected',
}

const STATUS_CONFIG: Record<string, {
  label: string; icon: React.ElementType;
  from: string; to: string; bar: string;
  badge: string; badgeDot: string;
  urgentPulse: boolean;
}> = {
  'Quotation Generated': {
    label: 'Quotation Generated', icon: FileText,
    from: 'from-blue-500', to: 'to-blue-700', bar: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-200', badgeDot: 'bg-blue-600',
    urgentPulse: false,
  },
  'Pending Approval': {
    label: 'Pending Approval', icon: Clock,
    from: 'from-amber-400', to: 'to-orange-500', bar: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200', badgeDot: 'bg-amber-600',
    urgentPulse: true,
  },
  'Admin Accepted': {
    label: 'Admin Accepted', icon: CheckCircle2,
    from: 'from-emerald-400', to: 'to-emerald-600', bar: 'bg-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', badgeDot: 'bg-emerald-500',
    urgentPulse: false,
  },
  'Quotation Sent': {
    label: 'Quotation Sent', icon: Send,
    from: 'from-indigo-500', to: 'to-indigo-700', bar: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', badgeDot: 'bg-indigo-600',
    urgentPulse: false,
  },
  'Completed': {
    label: 'Completed', icon: CheckCircle2,
    from: 'from-emerald-500', to: 'to-emerald-700', bar: 'bg-emerald-600',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-300', badgeDot: 'bg-emerald-700',
    urgentPulse: false,
  },
  'Rejected': {
    label: 'Rejected', icon: XCircle,
    from: 'from-red-400', to: 'to-red-600', bar: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200', badgeDot: 'bg-red-600',
    urgentPulse: false,
  },
}

// ─── helpers ───────────────────────────────────────────────────────────────────

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
    const d = new Date(Date.UTC(y, date.getMonth(), date.getDate()))
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
    return isNaN(d.getTime()) ? key : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (period === 'weekly') return key.replace('-', ' ')
  if (period === 'monthly') {
    const [y, m] = key.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    return isNaN(d.getTime()) ? key : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  return key
}

function fmt(v: number) {
  if (v >= 1_000_000) return `SAR ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `SAR ${(v / 1_000).toFixed(1)}K`
  return `SAR ${v.toFixed(0)}`
}

function fmtExact(v: number) {
  return `SAR ${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Generate continuous timeline slots so the chart doesn't look like giant chunky boxes
function generatePaddedBuckets(quotations: Quotation[], period: Period) {
  const map: Record<string, { count: number; value: number; quotations: Quotation[] }> = {}
  
  // Find dates range
  const now = new Date()
  let start = new Date(now)
  
  if (period === 'monthly') {
    start.setMonth(start.getMonth() - 5) // 6 months window
    for (let i = 0; i < 6; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
      const k = getPeriodKey(d, 'monthly')
      map[k] = { count: 0, value: 0, quotations: [] }
    }
  } else if (period === 'daily') {
    start.setDate(start.getDate() - 13) // 14 days window
    for (let i = 0; i < 14; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const k = getPeriodKey(d, 'daily')
      map[k] = { count: 0, value: 0, quotations: [] }
    }
  } else if (period === 'weekly') {
    start.setDate(start.getDate() - 7 * 7) // 8 weeks window
    for (let i = 0; i < 8; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i * 7)
      const k = getPeriodKey(d, 'weekly')
      map[k] = { count: 0, value: 0, quotations: [] }
    }
  } else {
    // yearly
    const yr = now.getFullYear()
    for (let i = 2; i >= 0; i--) {
      const k = `${yr - i}`
      map[k] = { count: 0, value: 0, quotations: [] }
    }
  }

  // Populate data
  quotations.forEach(q => {
    const key = getPeriodKey(parseDate(q.date), period)
    if (!map[key]) {
      map[key] = { count: 0, value: 0, quotations: [] }
    }
    map[key].count++
    map[key].value += q.grandTotal || 0
    map[key].quotations.push(q)
  })

  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
}

// ─── component ─────────────────────────────────────────────────────────────────

export default function StatusDetailPage({ params }: { params: Promise<{ status: string }> }) {
  const resolvedParams = use(params)
  const slug = resolvedParams.status
  const statusKey = SLUG_TO_STATUS[slug] ?? 'Quotation Generated'
  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG['Quotation Generated']
  const Icon = cfg.icon

  const { quotations } = useQuotations()
  const [period, setPeriod] = useState<Period>('monthly')
  const [graphView, setGraphView] = useState<GraphView>('trend')
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Filter to this status (e.g. Completed)
  const statusQuotations = useMemo(
    () => quotations.filter(q => q.status === statusKey),
    [quotations, statusKey]
  )

  const totalValue = useMemo(
    () => statusQuotations.reduce((s, q) => s + (q.grandTotal || 0), 0),
    [statusQuotations]
  )

  const avgValue = statusQuotations.length > 0 ? totalValue / statusQuotations.length : 0
  const avgDiscount = statusQuotations.length > 0
    ? statusQuotations.reduce((s, q) => s + (q.discount || 0), 0) / statusQuotations.length
    : 0

  // Time buckets with continuous padding
  const buckets = useMemo(
    () => generatePaddedBuckets(statusQuotations, period),
    [statusQuotations, period]
  )

  const maxVal = Math.max(...buckets.map(b => b[1].value), 1)

  // Peak period
  const peakBucket = useMemo(() => {
    if (buckets.length === 0) return null
    let maxB = buckets[0]
    buckets.forEach(b => {
      if (b[1].value > maxB[1].value) maxB = b
    })
    return maxB[1].value > 0 ? maxB : null
  }, [buckets])

  // Salesperson breakdown
  const salespersonStats = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {}
    statusQuotations.forEach(q => {
      const name = q.salesperson || 'General'
      if (!map[name]) map[name] = { count: 0, value: 0 }
      map[name].count++
      map[name].value += q.grandTotal || 0
    })
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data, share: totalValue > 0 ? (data.value / totalValue) * 100 : 0 }))
      .sort((a, b) => b.value - a.value)
  }, [statusQuotations, totalValue])

  // Customer breakdown
  const customerStats = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {}
    statusQuotations.forEach(q => {
      const name = q.customerName || 'Unknown Customer'
      if (!map[name]) map[name] = { count: 0, value: 0 }
      map[name].count++
      map[name].value += q.grandTotal || 0
    })
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data, share: totalValue > 0 ? (data.value / totalValue) * 100 : 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [statusQuotations, totalValue])

  // Table data: if a bucket is selected, show only those quotations; otherwise show all
  const tableQuotations = useMemo(() => {
    if (!selectedBucket) return [...statusQuotations].sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
    const bucket = buckets.find(([k]) => k === selectedBucket)
    return bucket ? [...bucket[1].quotations].sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()) : []
  }, [selectedBucket, statusQuotations, buckets])

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
  ]

  // Compute SVG coordinates for Smooth Curve Area Chart
  const svgWidth = 800
  const svgHeight = 220
  const padLeft = 60
  const padRight = 30
  const padTop = 25
  const padBottom = 35
  const chartW = svgWidth - padLeft - padRight
  const chartH = svgHeight - padTop - padBottom

  const points = useMemo(() => {
    if (buckets.length === 0) return []
    const step = buckets.length > 1 ? chartW / (buckets.length - 1) : chartW / 2
    return buckets.map(([key, data], i) => {
      const x = padLeft + (buckets.length > 1 ? i * step : chartW / 2)
      const y = padTop + chartH - (data.value / maxVal) * chartH
      return { x, y, key, ...data }
    })
  }, [buckets, maxVal, chartW, chartH, padLeft, padTop])

  // Build SVG path for smooth bezier curve
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' }
    if (points.length === 1) {
      const p = points[0]
      return {
        linePath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`,
        areaPath: `M ${p.x - 20} ${padTop + chartH} L ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${padTop + chartH} Z`
      }
    }
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const cx = (p0.x + p1.x) / 2
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`
    }
    const area = `${d} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`
    return { linePath: d, areaPath: area }
  }, [points, chartH, padTop])

  return (
    <div className="space-y-6 pb-28">

      {/* ── Top Breadcrumb & Page Header ── */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Link href="/admin" className="hover:text-blue-500 transition-colors">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Quotation Value ({cfg.label})</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <button className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cfg.from} ${cfg.to} flex items-center justify-center shadow-lg shadow-emerald-600/20`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{cfg.label} Quotations Overview</h2>
                <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Live Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Deep financial performance, closed deal metrics and visual trends</p>
            </div>
          </div>

          {/* Timeframe Granularity Selector */}
          {statusKey === 'Completed' && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400 ml-2" />
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => { setPeriod(p.key); setSelectedBucket(null); setHoveredIndex(null) }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    period === p.key
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Executive KPI Cards ── */}
      {statusKey === 'Completed' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Total Closed Value</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{fmtExact(totalValue)}</p>
            <p className="text-[11px] text-slate-400 mt-1">{statusQuotations.length} completed orders finalized</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Deal Size</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{fmtExact(avgValue)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Avg quotation value per client</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Peak Period</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {peakBucket ? fmt(peakBucket[1].value) : 'SAR 0'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {peakBucket ? `${formatPeriodLabel(peakBucket[0], period)} (${peakBucket[1].count} orders)` : 'No data yet'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Closer</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {salespersonStats[0]?.name || 'N/A'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {salespersonStats[0] ? `${fmt(salespersonStats[0].value)} (${salespersonStats[0].count} closed)` : '0 sales recorded'}
            </p>
          </div>
        </div>
      )}

      {/* ── Modern Multi-Mode Graph System ── */}
      {statusKey === 'Completed' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {/* Graph Header & View Mode Switcher */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  {graphView === 'trend' && <LineIcon className="w-4 h-4" />}
                  {graphView === 'bars' && <BarChart3 className="w-4 h-4" />}
                  {graphView === 'salesperson' && <Users className="w-4 h-4" />}
                  {graphView === 'customers' && <Building2 className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {graphView === 'trend' && 'Revenue Trend (Smooth Area Curve)'}
                  {graphView === 'bars' && 'Period Comparison (Column Bars)'}
                  {graphView === 'salesperson' && 'Salesperson Performance & Share'}
                  {graphView === 'customers' && 'Top Customer Contribution'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {graphView === 'trend' || graphView === 'bars'
                  ? 'Click any point or bar to filter the quotation table below'
                  : 'Breakdown of revenue across team members and accounts'}
              </p>
            </div>

            {/* View Mode Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setGraphView('trend')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  graphView === 'trend'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Trend Curve
              </button>
              <button
                onClick={() => setGraphView('bars')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  graphView === 'bars'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Columns
              </button>
              <button
                onClick={() => setGraphView('salesperson')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  graphView === 'salesperson'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Sales Team
              </button>
              <button
                onClick={() => setGraphView('customers')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  graphView === 'customers'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Top Clients
              </button>
            </div>
          </div>

          {/* Active Filter Indicator */}
          {selectedBucket && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-800/50 px-6 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                <span>Filtered by period:</span>
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[11px] font-bold">
                  {formatPeriodLabel(selectedBucket, period)}
                </span>
                <span className="text-emerald-600 font-normal">
                  ({tableQuotations.length} orders &mdash; {fmtExact(tableQuotations.reduce((s, q) => s + (q.grandTotal || 0), 0))})
                </span>
              </div>
              <button
                onClick={() => { setSelectedBucket(null); setHoveredIndex(null) }}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
              >
                ✕ Reset to All
              </button>
            </div>
          )}

          {/* Graph Body */}
          <div className="p-6">
            
            {/* VIEW 1: SVG AREA TREND CURVE */}
            {graphView === 'trend' && (
              <div className="relative">
                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-64 select-none"
                    style={{ minWidth: 600 }}
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                        <stop offset="80%" stopColor="#10b981" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="glow" />
                        <feComposite in="SourceGraphic" in2="glow" operator="over" />
                      </filter>
                    </defs>

                    {/* Y-Axis Grid Lines & Labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                      const yVal = padTop + chartH - pct * chartH
                      const labelVal = maxVal * pct
                      return (
                        <g key={i}>
                          <line
                            x1={padLeft}
                            y1={yVal}
                            x2={padLeft + chartW}
                            y2={yVal}
                            stroke="currentColor"
                            className="text-slate-200 dark:text-slate-800"
                            strokeDasharray={pct === 0 ? "0" : "4 4"}
                            strokeWidth="1"
                          />
                          <text
                            x={padLeft - 10}
                            y={yVal + 3}
                            textAnchor="end"
                            className="text-[10px] fill-slate-400 font-medium"
                          >
                            {fmt(labelVal)}
                          </text>
                        </g>
                      )
                    })}

                    {/* Area fill */}
                    {areaPath && (
                      <path d={areaPath} fill="url(#areaGradient)" />
                    )}

                    {/* Line path */}
                    {linePath && (
                      <path
                        d={linePath}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Interactive points & hover vertical lines */}
                    {points.map((p, idx) => {
                      const isHovered = hoveredIndex === idx
                      const isSelected = selectedBucket === p.key
                      return (
                        <g
                          key={p.key}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          onClick={() => setSelectedBucket(isSelected ? null : p.key)}
                        >
                          {/* Vertical guide line on hover */}
                          {isHovered && (
                            <line
                              x1={p.x}
                              y1={padTop}
                              x2={p.x}
                              y2={padTop + chartH}
                              stroke="#10b981"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                          )}

                          {/* Invisible wide hit area */}
                          <rect
                            x={p.x - 20}
                            y={padTop}
                            width="40"
                            height={chartH}
                            fill="transparent"
                          />

                          {/* Outer ring */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isSelected ? "7" : isHovered ? "6" : p.value > 0 ? "4.5" : "3"}
                            fill={isSelected ? "#059669" : "#ffffff"}
                            stroke="#10b981"
                            strokeWidth={isSelected ? "3" : "2"}
                            className="transition-all duration-150"
                            filter={isHovered || isSelected ? "url(#glow)" : undefined}
                          />

                          {/* X-Axis Label */}
                          <text
                            x={p.x}
                            y={padTop + chartH + 20}
                            textAnchor="middle"
                            className={`text-[10px] font-semibold transition-colors ${
                              isSelected
                                ? 'fill-emerald-600 font-bold'
                                : isHovered
                                ? 'fill-slate-800 dark:fill-slate-100'
                                : 'fill-slate-400'
                            }`}
                          >
                            {formatPeriodLabel(p.key, period)}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>

                {/* Floating Tooltip if point hovered */}
                {hoveredIndex !== null && points[hoveredIndex] && (
                  <div
                    className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-xl border border-white/10 flex items-center gap-4 pointer-events-none transition-all animate-in fade-in"
                  >
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                        {formatPeriodLabel(points[hoveredIndex].key, period)}
                      </p>
                      <p className="text-base font-black text-white leading-tight">
                        {fmtExact(points[hoveredIndex].value)}
                      </p>
                    </div>
                    <div className="border-l border-white/10 pl-3 text-start">
                      <p className="text-xs font-semibold text-slate-300">
                        {points[hoveredIndex].count} quotation{points[hoveredIndex].count !== 1 ? 's' : ''}
                      </p>
                      <p className="text-[10px] text-slate-400">Click to filter table</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: COLUMN BARS */}
            {graphView === 'bars' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 items-end h-56 pt-6 pb-2">
                  {buckets.map(([key, data]) => {
                    const pct = Math.max((data.value / maxVal) * 100, data.value > 0 ? 6 : 2)
                    const isSelected = selectedBucket === key
                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedBucket(isSelected ? null : key)}
                        className={`flex flex-col items-center justify-end h-full p-2 rounded-xl transition-all cursor-pointer group ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 ring-2 ring-emerald-500'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Value pill */}
                        <div className="mb-2 text-center">
                          {data.value > 0 ? (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                              isSelected ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-300 group-hover:text-emerald-600'
                            }`}>
                              {fmt(data.value)}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-300 dark:text-slate-600">SAR 0</span>
                          )}
                        </div>

                        {/* Bar container rail */}
                        <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-t-lg h-36 flex items-end justify-center p-0.5 overflow-hidden">
                          <div
                            style={{ height: `${pct}%` }}
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              isSelected
                                ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md shadow-emerald-500/30'
                                : data.value > 0
                                ? 'bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:from-emerald-600 group-hover:to-teal-300'
                                : 'bg-transparent'
                            }`}
                          />
                        </div>

                        {/* Period Label */}
                        <span className={`text-[10px] font-semibold mt-2 text-center truncate w-full ${
                          isSelected ? 'text-emerald-600 font-bold' : 'text-slate-500'
                        }`}>
                          {formatPeriodLabel(key, period)}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {data.count} {data.count === 1 ? 'deal' : 'deals'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* VIEW 3: SALESPERSON TEAM CONTRIBUTION */}
            {graphView === 'salesperson' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {salespersonStats.map((sp, idx) => (
                    <div
                      key={sp.name}
                      className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-sm ${
                            idx === 0 ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                            idx === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                            'bg-gradient-to-br from-slate-600 to-slate-700'
                          }`}>
                            #{idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{sp.name}</p>
                            <p className="text-[11px] text-slate-400">{sp.count} completed quotations</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{fmtExact(sp.value)}</p>
                          <p className="text-[10px] font-bold text-slate-400">{sp.share.toFixed(1)}% of total</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(sp.share, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4: TOP CLIENTS BREAKDOWN */}
            {graphView === 'customers' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerStats.map((cust, idx) => (
                    <div
                      key={cust.name}
                      className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{cust.name}</p>
                            <p className="text-[11px] text-slate-400">{cust.count} orders finalized</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{fmtExact(cust.value)}</p>
                          <p className="text-[10px] font-bold text-slate-400">{cust.share.toFixed(1)}% revenue</p>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(cust.share, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Full History Quotation Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Completed Quotations Registry
              {selectedBucket && <span className="ml-2 text-emerald-600 font-bold">&mdash; {formatPeriodLabel(selectedBucket, period)}</span>}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{tableQuotations.length} completed transactions</p>
          </div>
          <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
            Total: {fmtExact(tableQuotations.reduce((s, q) => s + (q.grandTotal || 0), 0))}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5 text-start">Quotation ID</th>
                <th className="px-5 py-3.5 text-start">Customer</th>
                <th className="px-5 py-3.5 text-start">Salesperson</th>
                <th className="px-5 py-3.5 text-start">Date</th>
                <th className="px-5 py-3.5 text-center">Discount</th>
                <th className="px-5 py-3.5 text-end">Grand Total</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText className="w-8 h-8 opacity-30" />
                      <p className="text-sm">No completed quotations in this selected period</p>
                    </div>
                  </td>
                </tr>
              ) : tableQuotations.map(q => (
                <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-5 py-3.5 font-bold text-blue-600 text-xs">{q.id}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200 text-sm">{q.customerName}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-sm">{q.salesperson}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{q.date}</td>
                  <td className="px-5 py-3.5 text-center">
                    {q.discount > 0
                      ? <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-xs">{q.discount}%</span>
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                  <td className="px-5 py-3.5 text-end font-black text-slate-900 dark:text-white">SAR {(q.grandTotal || 0).toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.badgeDot} ${cfg.urgentPulse ? 'animate-pulse' : ''}`} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Link href={`/admin/quotations/${q.id}`}>
                      <button className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 flex items-center justify-center text-slate-500 hover:text-emerald-700 transition-all mx-auto">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer with totals */}
        {tableQuotations.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{tableQuotations.length} transactions listed</span>
            <span className="font-black text-slate-900 dark:text-white">
              Total Realized: {fmtExact(tableQuotations.reduce((s, q) => s + (q.grandTotal || 0), 0))}
            </span>
          </div>
        )}
      </div>

    </div>
  )
}

