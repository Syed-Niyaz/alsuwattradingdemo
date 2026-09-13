'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, Pencil, Plus, Search, X, Save, ImageIcon, Upload, ChevronRight, Layers } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useLang } from '@/context/lang-context'
import { useProducts, Product } from '@/context/product-context'

const CATEGORIES = ['All Categories', 'Dinner Plates', 'Bowls', 'Platters', 'Serving', 'Trays', 'Accessories']

const stockBadge: Record<string, string> = {
  'In Stock': 'bg-emerald-50 text-emerald-700',
  'Low Stock': 'bg-amber-50 text-amber-700',
  'Out of Stock': 'bg-red-50 text-red-700',
}

export default function AdminProductsPage() {
  const { isRtl, lang } = useLang()
  const { products, setProducts } = useProducts() as any
  const router = useRouter()
  
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [colorFilter, setColorFilter] = useState('All Colors')
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [addVariantProduct, setAddVariantProduct] = useState<any>(null)
  
  // Extract all unique colors from products for the dropdown dynamically
  const allColors = Array.from(new Set(products.flatMap((p: Product) => p.variants.map(v => v.color))))
  
  // Filter products (by product, not by variant)
  const filtered = products.filter((p: Product) => {
    const matchSearch = p.name_en.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All Categories' || p.category === category
    return matchSearch && matchCat
  })
  
  const [editProduct, setEditProduct] = useState<any>(null)
  const [viewProduct, setViewProduct] = useState<any>(null)

  return (
    <div className="space-y-6 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Products</h2>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} products across {CATEGORIES.length - 1} categories</p>
        </div>
        <Button onClick={() => setIsAddingProduct(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <Card className="border-none shadow-sm shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        {/* Filter Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Category:</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800 border-transparent focus:border-blue-300 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4 text-start">Product</th>
                <th className="px-6 py-4 text-start">SKU</th>
                <th className="px-6 py-4 text-start">Category</th>
                <th className="px-6 py-4 text-center">Colors</th>
                <th className="px-6 py-4 text-end">Price (SAR)</th>
                <th className="px-6 py-4 text-center">Total Sales</th>
                <th className="px-6 py-4 text-center">Total Remaining</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((p: Product) => {
                const totalStock = p.variants.reduce((sum: number, v: any) => sum + v.stock, 0)
                const totalSales = p.variants.reduce((sum: number, v: any) => sum + (v.sales || 0), 0)
                const colorsAdded = p.variants.length
                return (
                  <tr 
                    key={p.id} 
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/admin/products/${p.id}`)}
                  >
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1">
                          <img 
                            src={p.image_url} 
                            alt={p.name_en}
                            className="max-w-full max-h-full object-contain drop-shadow-sm"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f5f0eb/8b7355?text=No+Image' }}
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{p.name_en}</div>
                          <div className="text-xs text-slate-400 font-normal mt-0.5">{p.name_ar}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.sku}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium">{p.category}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {p.variants.slice(0, 5).map((v: any) => (
                          <div 
                            key={v.color} 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: v.color.toLowerCase() === 'white' ? '#f8f8f8' : v.color.toLowerCase() === 'black' ? '#1e293b' : v.color.toLowerCase().includes('gold') ? '#d4af37' : v.color.toLowerCase().includes('gray') || v.color.toLowerCase().includes('grey') ? '#6b7280' : v.color.toLowerCase().includes('marble') ? '#e2d9d0' : v.color.toLowerCase().includes('cream') ? '#f5e9d3' : '#94a3b8' }}
                            title={`${v.color} (${v.sales ?? 0} sold, ${v.stock} remaining)`}
                          />
                        ))}
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">{colorsAdded}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-end font-semibold text-slate-800 dark:text-slate-200">SAR {((p.price_bw ?? (p as any).price ?? 0)).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{totalSales} <span className="text-xs font-normal text-slate-400">units</span></td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">{totalStock} <span className="text-xs font-normal text-slate-400">units</span></td>
                    <td className="px-6 py-4 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/products/${p.id}`) }}
                        className="h-8 px-3 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-semibold gap-1"
                      >
                        Manage <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="ltr">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add New Product</h2>
              <button onClick={() => setIsAddingProduct(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Product Name (English) *</label>
                  <Input id="add-name-en" placeholder="e.g. Soft Close Hinges" className="bg-white dark:bg-slate-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Product Name (Arabic) *</label>
                  <Input id="add-name-ar" placeholder="e.g. مفصلات إغلاق ناعم" className="bg-white dark:bg-slate-800 text-right" dir="rtl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">SKU *</label>
                  <Input id="add-sku" placeholder="e.g. HNG-120" className="bg-white dark:bg-slate-800" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category *</label>
                  <select id="add-category" defaultValue="" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                     <option value="" disabled>Select category</option>
                     {CATEGORIES.filter(c => c !== 'All Categories').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Black/White Price (SAR) *</label>
                  <Input id="add-price-bw" type="number" placeholder="0.00" className="bg-white dark:bg-slate-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Other Colors Price (SAR) *</label>
                  <Input id="add-price-colored" type="number" placeholder="0.00" className="bg-white dark:bg-slate-800" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Expected Delivery Date</label>
                  <Input id="add-delivery" type="date" className="bg-white dark:bg-slate-800 text-slate-500" />
                </div>
              </div>
              
              {/* Variant Section */}
              <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Initial Color Variant</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Color Name *</label>
                    <select id="add-color" defaultValue="" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      <option value="" disabled>Select a color</option>
                      {allColors.map((c: any) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Initial Stock *</label>
                    <Input id="add-stock" type="number" defaultValue={0} className="bg-white dark:bg-slate-800" />
                  </div>
                  
                  {/* Upload zone */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Upload Image for this Color</label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-3">
                        <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Click to upload or drag and drop</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP (max. 5MB)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <Button variant="outline" onClick={() => setIsAddingProduct(false)} className="bg-white font-semibold text-slate-700">Cancel</Button>
              <Button className="bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-sm px-6" onClick={() => {
                const name_en = (document.getElementById('add-name-en') as HTMLInputElement)?.value || '';
                const name_ar = (document.getElementById('add-name-ar') as HTMLInputElement)?.value || '';
                const sku = (document.getElementById('add-sku') as HTMLInputElement)?.value || '';
                const category = (document.getElementById('add-category') as HTMLSelectElement)?.value || '';
                const price = parseFloat((document.getElementById('add-price-bw') as HTMLInputElement)?.value || '0');
                const priceColored = parseFloat((document.getElementById('add-price-colored') as HTMLInputElement)?.value || String(price * 1.15));
                const delivery = (document.getElementById('add-delivery') as HTMLInputElement)?.value || '';
                const color = (document.getElementById('add-color') as HTMLSelectElement)?.value || '';
                const stock = parseInt((document.getElementById('add-stock') as HTMLInputElement)?.value || '0');
                
                if (!name_en || !name_ar || !sku || !category || !color) {
                  alert('Please fill in all required fields (English Name, Arabic Name, SKU, Category, Color).');
                  return;
                }
                
                const newProduct: Product = {
                  id: Date.now().toString(),
                  name_en: name_en,
                  name_ar: name_ar,
                  sku: sku,
                  category: category,
                  price_bw: price, price_colored: priceColored,
                  image_color: 'bg-stone-100',
                  base_image_url: '/images/placeholder',
                  image_url: 'https://placehold.co/400x400/f5f0eb/8b7355?text=New+Product',
                  expected: delivery || undefined,
                  variants: [{ color: color, stock: stock }]
                };
                
                setProducts((prev: Product[]) => [newProduct, ...prev]);
                setIsAddingProduct(false);
              }}>
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {addVariantProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="ltr">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add Color Variant</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">To: {addVariantProduct.name_en} ({addVariantProduct.sku})</p>
              </div>
              <button onClick={() => setAddVariantProduct(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-sm border border-slate-200 dark:border-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">New Color Name *</label>
                  <select id="variant-color" defaultValue="" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <option value="" disabled>Select a color</option>
                    {allColors.map((c: any) => {
                      const alreadyAdded = addVariantProduct?.variants?.some((v: any) => v.color === c)
                      return (
                        <option key={c} value={c} disabled={alreadyAdded} style={alreadyAdded ? { color: '#94a3b8' } : {}}>
                          {c}{alreadyAdded ? ' ✓ (already added)' : ''}
                        </option>
                      )
                    })}
                  </select>
                  {addVariantProduct && (
                    <p className="text-xs text-slate-400 mt-1">
                      {addVariantProduct.variants?.length || 0}/7 colors added
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Initial Stock *</label>
                  <Input id="variant-stock" type="number" defaultValue={0} className="bg-white dark:bg-slate-800" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Price (SAR) <span className="text-slate-400 font-normal text-xs">optional — overrides product default</span>
                  </label>
                  <Input id="variant-price" type="number" placeholder={String(addVariantProduct?.price || '')} className="bg-white dark:bg-slate-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Expected Delivery Date <span className="text-slate-400 font-normal text-xs">optional</span>
                  </label>
                  <Input id="variant-delivery" type="date" className="bg-white dark:bg-slate-800 text-slate-500" />
                </div>
                
                {/* Upload zone */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Upload Image for this Color</label>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-3">
                      <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP (max. 5MB)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <Button variant="outline" onClick={() => setAddVariantProduct(null)} className="bg-white font-semibold text-slate-700">Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm px-6" onClick={() => {
                const color = (document.getElementById('variant-color') as HTMLSelectElement)?.value || '';
                const stock = parseInt((document.getElementById('variant-stock') as HTMLInputElement)?.value || '0');
                const priceBwVal = (document.getElementById('variant-price-bw') as HTMLInputElement)?.value;
                const priceColoredVal = (document.getElementById('variant-price-colored') as HTMLInputElement)?.value;
                const delivery = (document.getElementById('variant-delivery') as HTMLInputElement)?.value;
                
                if (!color) {
                  alert('Please select a color variant.');
                  return;
                }
                
                setProducts((prev: Product[]) => prev.map(p => {
                  if (p.id === addVariantProduct.id) {
                    if (p.variants.some(v => v.color === color)) {
                      alert('This color already exists for this product!');
                      return p;
                    }
                    return {
                      ...p,
                      price_bw: priceBwVal ? parseFloat(priceBwVal) : (p.price_bw ?? (p as any).price ?? 0),
                      price_colored: priceColoredVal ? parseFloat(priceColoredVal) : (p.price_colored ?? (p.price_bw * 1.15)),
                      expected: delivery || p.expected,
                      variants: [...p.variants, { color, stock }]
                    }
                  }
                  return p;
                }));
                
                setAddVariantProduct(null);
              }}>
                <Plus className="w-4 h-4 mr-2" /> Save Variant
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="ltr">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Product</h2>
              <button onClick={() => setEditProduct(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Product Name *</label>
                  <Input defaultValue={editProduct.name} className="bg-white dark:bg-slate-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">SKU *</label>
                  <Input defaultValue={editProduct.sku} className="bg-white dark:bg-slate-800" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Parent Product</label>
                  <Input placeholder="e.g. Dinner Set (group color variants)" className="bg-white dark:bg-slate-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Select Color to Edit</label>
                  <select 
                    id="edit-color-select"
                    defaultValue={editProduct.variantColor}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    onChange={(e) => {
                      const newColor = e.target.value
                      const parentProduct = products.find((p: Product) => p.id === editProduct.id)
                      if (parentProduct) {
                        const variant = parentProduct.variants.find((v: any) => v.color === newColor)
                        if (variant) {
                          setEditProduct((prev: any) => ({ ...prev, variantColor: newColor, quantity: variant.stock }))
                        }
                      }
                    }}
                  >
                    {products.find((p: Product) => p.id === editProduct.id)?.variants.map((v: any) => (
                      <option key={v.color} value={v.color}>{v.color}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category *</label>
                  <select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" defaultValue={editProduct.category}>
                    {CATEGORIES.filter(c => c !== 'All Categories').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Black/White Price (SAR) *</label>
                  <Input id="edit-price-bw" type="number" defaultValue={editProduct.price_bw ?? editProduct.price} className="bg-white dark:bg-slate-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Other Colors Price (SAR) *</label>
                  <Input id="edit-price-colored" type="number" defaultValue={editProduct.price_colored ?? (editProduct.price_bw ?? editProduct.price) * 1.15} className="bg-white dark:bg-slate-800" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Available Quantity *</label>
                  <Input type="number" defaultValue={editProduct.quantity} id="edit-qty" className="bg-white dark:bg-slate-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Minimum Stock Level</label>
                  <Input type="number" defaultValue={10} className="bg-white dark:bg-slate-800" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Expected Delivery Date</label>
                  <Input type="date" defaultValue={editProduct.delivery !== '-' ? '2026-08-15' : ''} className="bg-white dark:bg-slate-800 text-slate-500" />
                </div>
                <div className="space-y-1.5 hidden sm:block"></div>

                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Image URL</label>
                  <Input defaultValue={`https://placehold.co/400x280/f5f0eb/8b7355?text=${editProduct.name.replace(/ /g, '+')}`} className="bg-white dark:bg-slate-800" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <Button variant="outline" onClick={() => setEditProduct(null)} className="bg-white font-semibold">Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm" onClick={() => {
                const qtyInput = document.getElementById('edit-qty') as HTMLInputElement
                if (qtyInput) {
                  const newQty = parseInt(qtyInput.value) || 0;
                  const priceBwInput = document.getElementById('edit-price-bw') as HTMLInputElement;
                  const priceColoredInput = document.getElementById('edit-price-colored') as HTMLInputElement;
                  const newPriceBw = priceBwInput ? parseFloat(priceBwInput.value) : editProduct.price_bw;
                  const newPriceColored = priceColoredInput ? parseFloat(priceColoredInput.value) : editProduct.price_colored;
                  setProducts((prev: Product[]) => prev.map(p => {
                    if (p.id === editProduct.id) {
                      return {
                        ...p,
                        variants: p.variants.map(v => v.color === editProduct.variantColor ? { ...v, stock: newQty } : v),
                        price_bw: newPriceBw,
                        price_colored: newPriceColored
                      }
                    }
                    return p
                  }))
                }
                setEditProduct(null)
              }}>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="ltr">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Product Details</h2>
              <button onClick={() => setViewProduct(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-24 h-24 bg-[#f5f0eb] dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-[#8b7355] dark:text-slate-400 p-4 text-center">
                  {viewProduct.name}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewProduct.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">{viewProduct.sku} · {viewProduct.variantColor}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">Parent Product</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">—</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">Available Quantity</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{viewProduct.quantity} units</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">Stock Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${viewProduct.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' :
                      viewProduct.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${viewProduct.status === 'In Stock' ? 'bg-emerald-500' :
                        viewProduct.status === 'Low Stock' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                    {viewProduct.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">Expected Delivery Date</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{viewProduct.delivery}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">Last Updated</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">18 Dec 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
