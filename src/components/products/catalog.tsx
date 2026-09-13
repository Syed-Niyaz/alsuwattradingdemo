'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Minus, ShoppingCart, Flame, X, CheckCircle2, Trash2 } from 'lucide-react'

import { useProducts } from '@/context/product-context'

// Dummy Data matching the provided image
const CATEGORIES = ['All', 'Dinner Plates', 'Bowls', 'Platters', 'Serving', 'Trays', 'Accessories']

export function ProductCatalog({ initialProducts, onProceedToQuotation, onCartChange, initialCart }: { initialProducts?: any[], onProceedToQuotation?: (cart: any[]) => void, onCartChange?: (items: any[]) => void, initialCart?: any[] }) {
  const { products } = useProducts()
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('Newest First')
  const [cart, setCart] = useState<{ product: any, qty: number, discount: number, color: string }[]>(initialCart || [])

  useEffect(() => {
    if (initialCart) setCart(initialCart)
  }, [initialCart])

  // Local state for product quantities being edited before adding to cart
  const [quantities, setQuantities] = useState<Record<string, number | string>>({})
  const [discounts, setDiscounts] = useState<Record<string, number | string>>({})
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({})
  const [expandedColors, setExpandedColors] = useState<Record<string, boolean>>({})

  // Popup state
  const [showPopup, setShowPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleQtyChange = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (Number(prev[id]) || 1) + delta)
    }))
  }

  const addToCart = (product: typeof products[0]) => {
    const qty = Number(quantities[product.id]) || 1
    const discount = Number(discounts[product.id]) || 0
    const color = selectedColors[product.id] || product.variants[0].color

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.color === color)
      let next: typeof prev
      if (existing) {
        next = prev.map(item => item === existing ? { ...item, qty: item.qty + qty, discount } : item)
      } else {
        next = [...prev, { product, qty, discount, color }]
      }
      return next
    })

    // reset local state for this item
    setQuantities(prev => ({ ...prev, [product.id]: 1 }))

    // Show popup message
    setPopupMessage(`Added ${qty}x ${product.name_en} to cart`)
    setShowPopup(true)
    setTimeout(() => {
      setShowPopup(false)
    }, 3000)
  }

  const removeFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    const matchesSearch = p.name_en.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  }).sort((a, b) => {
    if (sortBy === 'Name A-Z') {
      return a.name_en.localeCompare(b.name_en)
    } else if (sortBy === 'Price Low-High') {
      const getP = (p: any) => parseFloat(p.price_bw || "0") || parseFloat(p.price_colored || "0") || parseFloat(p.price || "0") || 0;
      return getP(a) - getP(b)
    }
    // Newest First keeps the order from the context (which is newest first)
    return 0;
  })

  // Notify parent whenever cart changes
  useEffect(() => {
    onCartChange?.(cart)
  }, [cart])

  // Cart Drawer State
  const [isCartOpen, setIsCartOpen] = useState(false)
  const cartTotal = cart.reduce((acc, item) => {
    const pr = item.product || ({} as any)
    const isBW = item.color === 'BLACK' || item.color === 'WHITE' || item.color === 'Black' || item.color === 'White'
    const p_bw = typeof pr.price_bw === 'number' ? pr.price_bw : parseFloat(String(pr.price_bw || 0))
    const p_col = typeof pr.price_colored === 'number' ? pr.price_colored : parseFloat(String(pr.price_colored || 0))
    const p_gen = typeof (pr as any).price === 'number' ? (pr as any).price : parseFloat(String((pr as any).price || 0))
    const i_p = typeof (item as any).price === 'number' ? (item as any).price : parseFloat(String((item as any).price || 0))
    const unitPrice = (isBW ? (p_bw || p_gen) : (p_col || p_bw || p_gen)) || i_p || 0
    return acc + unitPrice * item.qty * (1 - item.discount / 100)
  }, 0)

  return (
    <div className="space-y-6 relative">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 text-orange-500 font-semibold text-sm">
          <Flame className="w-4 h-4" /> Frequently Ordered
        </div>
        <Button variant="outline" className="relative bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 h-8 text-sm" onClick={() => setIsCartOpen(true)}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          View Cart
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {cart.length}
            </span>
          )}
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or Arabic..."
            className="pl-9 bg-white dark:bg-slate-900 rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <select 
            className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Newest First">Newest First</option>
            <option value="Name A-Z">Name A-Z</option>
            <option value="Price Low-High">Price Low-High</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
        {filteredProducts.map(p => {
          const pAny = p as any
          const getPrice = (isBW: boolean) => { const p_bw=parseFloat(pAny.price_bw||"0"); const p_col=parseFloat(pAny.price_colored||"0"); const p_gen=parseFloat(pAny.price||"0"); const i_p=parseFloat(pAny.price as string||"0"); return (isBW ? (p_bw || p_gen) : (p_col || p_bw || p_gen)) || i_p || 0; }
          const selectedColor = selectedColors[p.id] || p.variants[0].color
          const variant = p.variants.find(v => v.color === selectedColor) || p.variants[0]
          const isLowStock = variant.stock > 0 && variant.stock <= 10
          const isOutOfStock = variant.stock === 0
          
          const imgColorSuffix = selectedColor.toLowerCase().replace(/ /g, '_')
          const dynamicImageUrl = `${p.base_image_url}_${imgColorSuffix}.png`

          return (
          <Card key={p.id} className="overflow-hidden flex flex-col bg-white dark:bg-slate-900 border shadow-sm rounded-xl">
            {/* Compact Image */}
            <div className="w-full pt-4 pb-3 flex justify-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <div
                className="h-32 w-32 relative overflow-hidden rounded-xl cursor-pointer shadow-sm border border-slate-100 dark:border-slate-800 transition-transform hover:scale-105"
                onClick={() => p.image_url && setPreviewImage(dynamicImageUrl)}
              >
                {p.image_url ? (
                  <img 
                    src={dynamicImageUrl} 
                    onError={(e) => { e.currentTarget.src = p.image_url; e.currentTarget.onerror = null }} 
                    alt={p.name_en} 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-sm font-bold text-center px-2 text-slate-400 flex items-center justify-center h-full">
                    {p.name_en}
                  </span>
                )}
              </div>
            </div>

            <CardContent className="p-3 pt-2.5 flex-1 flex flex-col gap-1.5">
              {/* Name & Arabic */}
              <div className="flex justify-between items-start gap-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{p.name_en}</h3>
                <span className="text-[10px] text-slate-400 font-arabic text-right leading-tight shrink-0">{p.name_ar}</span>
              </div>

              {/* SKU & Category */}
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>{p.sku}</span>
                <span>•</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{p.category}</span>
              </div>

              {/* Price */}
              <div className="text-sm font-bold text-blue-700 dark:text-blue-400">
                SAR {getPrice(selectedColor === 'BLACK' || selectedColor === 'WHITE' || selectedColor === 'Black' || selectedColor === 'White').toFixed(2)}
              </div>

              {/* Stock status */}
              <div className="flex items-center gap-1.5 text-[10px] font-medium">
                {isOutOfStock ? (
                  <span className="flex items-center gap-1 text-red-700 bg-red-50 px-1.5 py-0.5 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Out of Stock</span>
                ) : isLowStock ? (
                  <span className="flex items-center gap-1 text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> Low Stock</span>
                ) : (
                  <span className="flex items-center gap-1 text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> In Stock</span>
                )}
                <span className="text-slate-400">Avail: {variant.stock}</span>
              </div>

              {/* Expected warning — only show when quantity exceeds stock */}
              {(Number(quantities[p.id]) || 1) > variant.stock && p.expected && (
                <div className="text-[10px] text-orange-600 flex items-center gap-1 font-medium bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg mt-1 mb-1">
                  🚚 <span>Expected: <strong>{p.expected}</strong></span>
                </div>
              )}


              <div className="mt-auto space-y-2 pt-2 border-t">
                {/* Colors */}
                {p.variants.length >= 1 && (
                  <div className="flex items-start gap-1 text-[10px]">
                    <span className="text-muted-foreground shrink-0 pt-0.5">Colors:</span>
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="grid grid-cols-2 gap-1">
                        {(expandedColors[p.id] ? p.variants : p.variants.slice(0, 3)).map(v => {
                          const c = v.color
                          return (
                          <button
                            key={c}
                            onClick={() => setSelectedColors(prev => ({ ...prev, [p.id]: c }))}
                            className={`flex items-center gap-1 border px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-all ${selectedColors[p.id] === c ? 'ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-300' : 'bg-white dark:bg-slate-800 hover:bg-slate-50'}`}
                          >
                            <div className={`w-2 h-2 rounded-full border border-black/10 shrink-0 ${c === 'BLACK' ? 'bg-slate-900' :
                                c === 'BLACK MARBLE' ? 'bg-slate-700' :
                                  c === 'GRAY 1200' ? 'bg-[#4a4a4a]' :
                                    c === 'WHITE' ? 'bg-white' :
                                      c === 'WHITE MARBLE' ? 'bg-slate-100' :
                                        c === 'CREAM DOT' ? 'bg-[#f5e9d3]' :
                                          c === 'GOLDEN MARBLA' ? 'bg-[#d4af37]' : 'bg-white'
                              }`}></div>
                            <span className="truncate">{c}</span>
                          </button>
                        )})}
                      </div>
                      <div className="flex gap-1">
                        {!expandedColors[p.id] && p.variants.length > 3 && (
                          <button onClick={() => setExpandedColors(prev => ({ ...prev, [p.id]: true }))}
                            className="border px-1.5 py-0.5 rounded-full text-[9px] bg-slate-50 hover:bg-slate-100 text-slate-500 font-medium">
                            +{p.variants.length - 3} more
                          </button>
                        )}
                        {expandedColors[p.id] && (
                          <button onClick={() => setExpandedColors(prev => ({ ...prev, [p.id]: false }))}
                            className="border px-1.5 py-0.5 rounded-full text-[9px] bg-slate-50 hover:bg-slate-100 text-slate-500 font-medium">
                            ← Back
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Discount */}
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-muted-foreground">Discount</span>
                  <div className="flex items-center border rounded px-1.5 py-0.5 w-16 bg-white dark:bg-slate-900">
                    <input
                      type="number"
                      className="w-full bg-transparent outline-none text-right text-xs"
                      value={discounts[p.id] !== undefined ? discounts[p.id] : 0}
                      onChange={e => setDiscounts(prev => ({ ...prev, [p.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                      onFocus={e => {
                        if (discounts[p.id] === 0 || discounts[p.id] === undefined) {
                          setDiscounts(prev => ({ ...prev, [p.id]: '' }))
                        }
                      }}
                      onBlur={e => {
                        if (e.target.value === '') setDiscounts(prev => ({ ...prev, [p.id]: 0 }))
                      }}
                    />
                    <span className="ml-1 text-muted-foreground">%</span>
                  </div>
                </div>

                {/* Add to Cart */}
                <div className="flex gap-2 items-center mt-2 pt-2 border-t">
                  <div className="flex items-center border rounded-md h-8 bg-white dark:bg-slate-900 shrink-0 w-24">
                    <button
                      className="px-2 h-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      onClick={() => handleQtyChange(p.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      className="w-full text-center text-xs font-semibold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={quantities[p.id] !== undefined ? quantities[p.id] : 1}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          setQuantities(prev => ({ ...prev, [p.id]: '' }))
                        } else {
                          const val = parseInt(e.target.value)
                          if (!isNaN(val) && val > 0) {
                            setQuantities(prev => ({ ...prev, [p.id]: val }))
                          }
                        }
                      }}
                    />
                    <button
                      className="px-2 h-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      onClick={() => handleQtyChange(p.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 h-8 text-xs disabled:opacity-50"
                    onClick={() => addToCart(p)}
                  >
                    {isOutOfStock ? 'Pre-order' : 'Add'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Current Quotation</h2>
              <p className="text-muted-foreground">Review items before finalizing</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-muted-foreground mt-10">Cart is empty</div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 border-b pb-4">
                    <div className={`w-16 h-16 rounded-md relative overflow-hidden ${item.product.image_color} flex-shrink-0`}>
                      {item.product.image_url && <img src={item.product.image_url} alt={item.product.name_en} className="absolute inset-0 w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.product.name_en}</h4>
                      <p className="text-xs text-muted-foreground">{item.color} • Qty: {item.qty}</p>
                      {item.discount > 0 && <span className="text-xs text-red-500 font-medium">-{item.discount}% off</span>}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        SAR {(() => {
                          const pr = item.product || ({} as any)
                          const isBW = item.color === 'BLACK' || item.color === 'WHITE' || item.color === 'Black' || item.color === 'White'
                          const p_bw = typeof pr.price_bw === 'number' ? pr.price_bw : parseFloat(String(pr.price_bw || 0))
                          const p_col = typeof pr.price_colored === 'number' ? pr.price_colored : parseFloat(String(pr.price_colored || 0))
                          const p_gen = typeof (pr as any).price === 'number' ? (pr as any).price : parseFloat(String((pr as any).price || 0))
                          const i_p = typeof (item as any).price === 'number' ? (item as any).price : parseFloat(String((item as any).price || 0))
                          const up = (isBW ? (p_bw || p_gen) : (p_col || p_bw || p_gen)) || i_p || 0
                          return (up * item.qty * (1 - item.discount / 100)).toFixed(2)
                        })()}
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(idx)} className="text-slate-400 hover:text-red-600 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t bg-slate-50 dark:bg-slate-900">
              <div className="flex justify-between items-center mb-4 text-lg font-bold">
                <span>Subtotal</span>
                <span>SAR {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-6 text-sm text-muted-foreground">
                <span>VAT (15%)</span>
                <span>SAR {(cartTotal * 0.15).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-6 text-xl font-bold text-blue-700 dark:text-blue-400">
                <span>Total</span>
                <span>SAR {(cartTotal * 1.15).toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setIsCartOpen(false)}>Continue Shopping</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                  if (onProceedToQuotation) {
                    onProceedToQuotation(cart)
                    setIsCartOpen(false)
                  } else {
                    alert('Quotation saved successfully!')
                    setCart([])
                    setIsCartOpen(false)
                  }
                }}>{onProceedToQuotation ? 'Review & Generate' : 'Save Quotation'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showPopup && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{popupMessage}</span>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => setPreviewImage(null)}></div>
          <div className="relative w-full max-w-4xl h-[80vh] flex items-center justify-center animate-in zoom-in-95 duration-200">
            <button
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}
