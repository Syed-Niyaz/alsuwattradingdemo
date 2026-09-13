'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useProducts, Product, ProductVariant } from '@/context/product-context'
import { useLang } from '@/context/lang-context'
import { ArrowLeft, Plus, Pencil, Eye, X, Save, ImageIcon } from 'lucide-react'

const ALL_COLORS = ['WHITE', 'BLACK', 'GOLDEN MARBLA', 'WHITE MARBLE', 'CREAM DOT', 'BLACK MARBLE', 'GRAY 1200']

const colorDot = (color: string) => {
  const c = color.toLowerCase()
  if (c === 'white') return '#f8f8f8'
  if (c === 'black') return '#1e293b'
  if (c.includes('gold')) return '#d4af37'
  if (c.includes('gray') || c.includes('grey')) return '#6b7280'
  if (c === 'black marble') return '#2d2d2d'
  if (c.includes('marble')) return '#e2d9d0'
  if (c.includes('cream')) return '#f5e9d3'
  return '#94a3b8'
}

const getStockBadge = (stock: number) => {
  if (stock === 0) return { label: 'Out of Stock', bg: 'bg-red-50 text-red-700', dot: 'bg-red-500' }
  if (stock < 50) return { label: 'Low Stock', bg: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' }
  return { label: 'In Stock', bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' }
}

export default function AdminProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isRtl } = useLang()
  const { products, setProducts } = useProducts() as any

  const product: Product | undefined = products.find((p: Product) => p.id === params.id)

  const [addVariantOpen, setAddVariantOpen] = useState(false)
  const [editVariant, setEditVariant] = useState<ProductVariant | null>(null)
  const [viewVariant, setViewVariant] = useState<ProductVariant | null>(null)
  const [editProductOpen, setEditProductOpen] = useState(false)

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-4">
        <p className="text-lg font-semibold">Product not found.</p>
        <Button onClick={() => router.push('/admin/products')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
        </Button>
      </div>
    )
  }

  const availableColors = ALL_COLORS.filter(c => !product.variants.some(v => v.color === c))

  const handleSaveVariant = () => {
    if (!editVariant) return
    const qty = (document.getElementById('ev-stock') as HTMLInputElement)?.value
    const newStock = parseInt(qty) || 0
    setProducts((prev: Product[]) => prev.map(p =>
      p.id === product.id
        ? { ...p, variants: p.variants.map(v => v.color === editVariant.color ? { ...v, stock: newStock } : v) }
        : p
    ))
    setEditVariant(null)
  }

  const handleAddVariant = () => {
    const colorSel = (document.getElementById('av-color') as HTMLSelectElement)?.value
    const stock = parseInt((document.getElementById('av-stock') as HTMLInputElement)?.value || '0')
    const sales = parseInt((document.getElementById('av-sales') as HTMLInputElement)?.value || '0')
    if (!colorSel) { alert('Please select a color.'); return }
    setProducts((prev: Product[]) => prev.map(p =>
      p.id === product.id
        ? { ...p, variants: [...p.variants, { color: colorSel, stock, sales }] }
        : p
    ))
    setAddVariantOpen(false)
  }

  const handleSaveProductDetails = () => {
    const name_en = (document.getElementById('ep-name-en') as HTMLInputElement)?.value
    const name_ar = (document.getElementById('ep-name-ar') as HTMLInputElement)?.value
    const sku = (document.getElementById('ep-sku') as HTMLInputElement)?.value
    const category = (document.getElementById('ep-category') as HTMLSelectElement)?.value
    const priceBw = parseFloat((document.getElementById('ep-price-bw') as HTMLInputElement)?.value || '0')
    const priceColored = parseFloat((document.getElementById('ep-price-colored') as HTMLInputElement)?.value || '0')
    const delivery = (document.getElementById('ep-delivery') as HTMLInputElement)?.value

    if (!name_en || !name_ar || !sku || !category) {
      alert('Please fill in all required fields.')
      return
    }

    setProducts((prev: Product[]) => prev.map(p =>
      p.id === product.id
        ? {
            ...p,
            name_en,
            name_ar,
            sku,
            category,
            price_bw: priceBw,
            price_colored: priceColored,
            expected: delivery || undefined
          }
        : p
    ))
    setEditProductOpen(false)
  }

  return (
    <div className="space-y-6 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/admin/products')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Products
        </button>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{product.name_en}</span>
      </div>

      {/* Product Info Card */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-28 h-28 rounded-xl border border-slate-100 dark:border-slate-800 bg-[#f5f0eb] overflow-hidden flex items-center justify-center shrink-0">
            <img
              src={product.image_url}
              alt={product.name_en}
              className="max-w-full max-h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f5f0eb/8b7355?text=No+Image' }}
            />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{product.name_en}</h1>
                  <button
                    onClick={() => setEditProductOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                    title="Edit Product Details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
                <p className="text-slate-400 text-sm font-arabic mt-0.5">{product.name_ar}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono">{product.sku}</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-semibold">{product.category}</span>
                  {product.expected && (
                    <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-semibold">🚚 {product.expected}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">SAR {(product.price_bw ?? (product as any).price ?? 0).toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-1">{product.variants.length}/7 colors added</p>
                <div className="mt-2 flex items-center justify-end gap-2 text-xs font-semibold">
                  <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-lg">
                    🛒 {product.variants.reduce((acc, v) => acc + (v.sales || 0), 0)} Total Sold
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                    📦 {product.variants.reduce((acc, v) => acc + (v.stock || 0), 0)} Total Stock
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Color Variants</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {product.variants.length} color{product.variants.length !== 1 ? 's' : ''} added · {availableColors.length} remaining
          </p>
        </div>
        {availableColors.length > 0 && (
          <Button
            onClick={() => setAddVariantOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Color
          </Button>
        )}
      </div>

      {/* Color Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {product.variants.map((v: ProductVariant) => {
          const badge = getStockBadge(v.stock)
          return (
            <Card key={v.color} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="h-40 bg-[#f5f0eb] dark:bg-slate-800 flex items-center justify-center relative">
                <img
                  src={`${product.base_image_url}_${v.color.toLowerCase().replace(/ /g, '_')}.png`}
                  alt={v.color}
                  className="max-h-full max-w-full object-contain p-4"
                  onError={(e) => { (e.target as HTMLImageElement).src = product.image_url }}
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
                  <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: colorDot(v.color) }} />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 tracking-wide">{v.color}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">Stock Metrics</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Sold</p>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                      {v.sales ?? 0} <span className="text-[10px] font-normal text-slate-400">units</span>
                    </p>
                  </div>
                  <div className="border-l border-slate-200 dark:border-slate-700 pl-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remaining</p>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                      {v.stock} <span className="text-[10px] font-normal text-slate-400">units</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewVariant(v)}
                    className="flex-1 h-8 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200">
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditVariant(v)}
                    className="flex-1 h-8 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200">
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 7 - product.variants.length) }).map((_, i) => (
          <Card
            key={`empty-${i}`}
            onClick={() => setAddVariantOpen(true)}
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 bg-transparent rounded-2xl overflow-hidden hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all cursor-pointer group"
          >
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold">Add Color</p>
            </div>
            <div className="p-4 border-t border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 text-center">Tap to add a new color variant</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── ADD VARIANT MODAL ── */}
      {addVariantOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add Color Variant</h2>
                <p className="text-xs text-slate-500 mt-0.5">Product: {product.name_en}</p>
              </div>
              <button onClick={() => setAddVariantOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Color *</label>
                <select id="av-color" defaultValue="" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <option value="" disabled>Select a color</option>
                  {availableColors.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="text-xs text-slate-400">{product.variants.length}/7 colors added</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Initial Stock *</label>
                <Input id="av-stock" type="number" defaultValue={0} className="bg-white dark:bg-slate-800" />
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Upload Image for this Color</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center text-center hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-3">
                    <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP (max. 5MB)</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <Button variant="outline" onClick={() => setAddVariantOpen(false)} className="bg-white font-semibold text-slate-700">Cancel</Button>
              <Button onClick={handleAddVariant} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6">
                <Plus className="w-4 h-4 mr-2" /> Add Variant
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT VARIANT MODAL ── */}
      {editVariant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: colorDot(editVariant.color) }} />
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit — {editVariant.color}</h2>
                  <p className="text-xs text-slate-500">{product.name_en}</p>
                </div>
              </div>
              <button onClick={() => setEditVariant(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Color</label>
                <Input value={editVariant.color} readOnly className="bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Available Stock *</label>
                <Input id="ev-stock" type="number" defaultValue={editVariant.stock} className="bg-white dark:bg-slate-800" />
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Replace Image</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center text-center hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/50">
                  <ImageIcon className="w-5 h-5 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500">Click to upload a new image for {editVariant.color}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <Button variant="outline" onClick={() => setEditVariant(null)} className="bg-white font-semibold text-slate-700">Cancel</Button>
              <Button onClick={handleSaveVariant} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW VARIANT MODAL ── */}
      {viewVariant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Color Details</h2>
              <button onClick={() => setViewVariant(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="h-48 bg-[#f5f0eb] dark:bg-slate-800 rounded-xl mb-5 flex items-center justify-center overflow-hidden">
                <img
                  src={`${product.base_image_url}_${viewVariant.color.toLowerCase().replace(/ /g, '_')}.png`}
                  alt={viewVariant.color}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = product.image_url }}
                />
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: colorDot(viewVariant.color) }} />
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{viewVariant.color}</p>
                  <p className="text-xs text-slate-400">{product.name_en} · {product.sku}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">Products Sold</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{viewVariant.sales ?? 0} <span className="text-xs font-normal text-slate-400">units</span></p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Remaining Stock</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{viewVariant.stock} <span className="text-xs font-normal text-slate-400">units</span></p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Status</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getStockBadge(viewVariant.stock).bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStockBadge(viewVariant.stock).dot}`} />
                      {getStockBadge(viewVariant.stock).label}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Price</p>
                  <p className="text-sm font-bold text-blue-600 mt-1">SAR {(product.price_bw ?? (product as any).price ?? 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── EDIT PRODUCT DETAILS MODAL ── */}
      {editProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Product Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">SKU: {product.sku}</p>
              </div>
              <button onClick={() => setEditProductOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Product Name (English) *</label>
                <Input id="ep-name-en" defaultValue={product.name_en} className="bg-white dark:bg-slate-800" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Product Name (Arabic) *</label>
                <Input id="ep-name-ar" defaultValue={product.name_ar} className="bg-white dark:bg-slate-800 text-right" dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">SKU *</label>
                <Input id="ep-sku" defaultValue={product.sku} className="bg-white dark:bg-slate-800" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category *</label>
                <select id="ep-category" defaultValue={product.category} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {['Dinner Plates', 'Bowls', 'Platters', 'Serving', 'Trays', 'Accessories'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Black/White Price (SAR) *</label>
                <Input id="ep-price-bw" type="number" step="0.01" defaultValue={product.price_bw ?? (product as any).price ?? 0} className="bg-white dark:bg-slate-800" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Other Colors Price (SAR) *</label>
                <Input id="ep-price-colored" type="number" step="0.01" defaultValue={product.price_colored ?? ((product.price_bw ?? (product as any).price ?? 0) * 1.15)} className="bg-white dark:bg-slate-800" />
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Expected Delivery Date</label>
                <Input id="ep-delivery" type="date" defaultValue={product.expected || ''} className="bg-white dark:bg-slate-800 text-slate-500" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <Button variant="outline" onClick={() => setEditProductOpen(false)} className="bg-white font-semibold text-slate-700">Cancel</Button>
              <Button onClick={handleSaveProductDetails} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
