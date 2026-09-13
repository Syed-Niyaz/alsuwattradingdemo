'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package2, CheckCircle, AlertTriangle, XCircle, Search } from 'lucide-react'
import { useState, Suspense, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { useProducts } from '@/context/product-context'

const MIN_STOCK = 10

function getStockStatus(totalStock: number): string {
  if (totalStock === 0) return 'Out of Stock'
  if (totalStock < MIN_STOCK) return 'Low Stock'
  return 'In Stock'
}

const FILTER_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; desc: string }> = {
  'Total Products': { icon: Package2,     color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-200',    desc: 'All products in inventory' },
  'In Stock':       { icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'Products currently available' },
  'Low Stock':      { icon: AlertTriangle,color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   desc: 'Products that need reordering soon' },
  'Out of Stock':   { icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     desc: 'Products requiring immediate restocking' },
}

const STATUS_BADGE: Record<string, string> = {
  'In Stock':     'bg-emerald-100 text-emerald-700',
  'Low Stock':    'bg-amber-100 text-amber-700',
  'Out of Stock': 'bg-red-100 text-red-700',
}

function StockContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const { products } = useProducts()

  // Compute flat product stock list from context (live data)
  const allProducts = useMemo(() => products.map(p => {
    const totalQty = p.variants.reduce((sum, v) => sum + v.stock, 0)
    const status = getStockStatus(totalQty)
    return {
      id: p.id,
      name: p.name_en,
      nameAr: p.name_ar,
      sku: p.sku,
      category: p.category,
      qty: totalQty,
      minStock: MIN_STOCK,
      status,
      variants: p.variants,
    }
  }), [products])

  const rawFilter = searchParams.get('filter') || 'Total Products'
  const config = FILTER_CONFIG[rawFilter] || FILTER_CONFIG['Total Products']
  const Icon = config.icon

  const filtered = allProducts.filter(p => {
    const matchesFilter = rawFilter === 'Total Products' ? true : p.status === rawFilter
    const matchesSearch = search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const showMinStock = rawFilter === 'Low Stock' || rawFilter === 'Total Products' || rawFilter === 'Out of Stock'

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${config.bg} ${config.border} border`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              {rawFilter} <span className={`text-base font-semibold ${config.color}`}>({filtered.length})</span>
            </h2>
            <p className="text-sm text-slate-500">{config.desc}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(FILTER_CONFIG).map(([key, cfg]) => {
          const count = key === 'Total Products'
            ? allProducts.length
            : allProducts.filter(p => p.status === key).length
          const TabIcon = cfg.icon
          const isActive = rawFilter === key
          return (
            <Link key={key} href={`/products/stock?filter=${encodeURIComponent(key)}`}>
              <button className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                isActive
                  ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                  : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}>
                <TabIcon className="w-3.5 h-3.5" />
                {key} ({count})
              </button>
            </Link>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or SKU..."
          className="pl-9 bg-white dark:bg-slate-900 rounded-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Arabic Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Total Qty</th>
                {showMinStock && <th className="px-6 py-4 text-center">Min Stock</th>}
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">No products found.</td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      p.status === 'Out of Stock'
                        ? 'bg-red-50/60 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : p.status === 'Low Stock'
                        ? 'bg-amber-50/30 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="px-6 py-4 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">{p.name}</td>
                    <td className="px-6 py-4 text-slate-500">{p.nameAr}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                        {p.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-lg font-black ${
                          p.qty === 0 ? 'text-red-600' : p.qty < p.minStock ? 'text-amber-600' : 'text-slate-800 dark:text-white'
                        }`}>
                          {p.qty}
                        </span>
                        {/* Show variant breakdown on hover */}
                        <div className="flex flex-wrap justify-center gap-1 max-w-[180px]">
                          {p.variants.filter(v => v.stock > 0).slice(0, 3).map(v => (
                            <span key={v.color} className="text-[10px] text-slate-400 font-mono">
                              {v.color.split(' ')[0]}:{v.stock}
                            </span>
                          ))}
                          {p.variants.filter(v => v.stock > 0).length > 3 && (
                            <span className="text-[10px] text-slate-400">+{p.variants.filter(v => v.stock > 0).length - 3}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {showMinStock && (
                      <td className="px-6 py-4 text-center text-slate-400 font-medium">{p.minStock}</td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[p.status]}`}>
                          {p.status}
                        </span>
                        {p.status === 'Out of Stock' && (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide animate-pulse">
                            ⚠ Restock Now
                          </span>
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
    </div>
  )
}

export default function StockPage() {
  return (
    <Suspense fallback={<div>Loading stock...</div>}>
      <StockContent />
    </Suspense>
  )
}
