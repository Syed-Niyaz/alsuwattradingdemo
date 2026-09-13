'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Plus, Minus, X, ShoppingCart, Flame, Check, ArrowRight, ArrowLeft, UserPlus, Trash2, Upload } from 'lucide-react'
import { useLang } from '@/context/lang-context'
import { ProductCatalog } from '@/components/products/catalog'
import { useQuotations } from '@/context/quotation-context'
import { useProducts } from '@/context/product-context'
import { useCustomers, Customer } from '@/context/customer-context'
import { useNotifications } from '@/context/notification-context'
import { useAuth } from '@/context/auth-context'

// Mock Products
const CATEGORIES = ['All', 'Dinner Plates', 'Bowls', 'Platters', 'Serving', 'Trays', 'Accessories']

import { Product } from '@/context/product-context'

type CartItem = {
  product: Product
  qty: number
  discount: number | string
  color: string
}

type CustomerInfo = Customer

function NewQuotationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomerId = searchParams.get('customer')
  const { lang, isRtl } = useLang()
  const { addQuotation } = useQuotations()
  const { deductStock } = useProducts()
  const { addCustomer, customers: globalCustomers } = useCustomers()
  const { addNotification } = useNotifications()
  const { displayName } = useAuth()
  const ar = lang === 'ar'

  const [step, setStep] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [visitDate, setVisitDate] = useState(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }))
  const [visitTime, setVisitTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }))
  const [visitPurpose, setVisitPurpose] = useState('New Order')
  const [cart, setCart] = useState<CartItem[]>([])
  const [catalogCartItems, setCatalogCartItems] = useState<any[]>([])
  const [remarks, setRemarks] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: '', contact_person: '', mobile_no: '', email: '', vat: '', cr: '', address: '', notes: ''
  })

  // Product filters
  const [activeCategory, setActiveCategory] = useState('All')
  const [productSearch, setProductSearch] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [discounts, setDiscounts] = useState<Record<string, number | string>>({})
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({})
  const [showCartDrawer, setShowCartDrawer] = useState(false)
  const [expandedColors2, setExpandedColors2] = useState<Record<string, boolean>>({})

  // Popup state
  const [showPopup, setShowPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')

  // Pre-select customer from URL param or hydrate edit state
  useEffect(() => {
    const isEdit = searchParams.get('edit') === 'true'
    if (isEdit) {
      const data = sessionStorage.getItem('quotation_data')
      if (data) {
        try {
          const q = JSON.parse(data)
          if (q.customer) setSelectedCustomer(q.customer)
          if (q.items) {
            setCart(q.items)
            setCatalogCartItems(q.items)
          }
          if (q.remarks) setRemarks(q.remarks)
          setStep(3) // Jump to review step
        } catch(e) {}
      }
    } else if (preselectedCustomerId) {
      const found = globalCustomers.find(c => c.id === preselectedCustomerId)
      if (found) setSelectedCustomer(found)
    }
  }, [preselectedCustomerId, searchParams, globalCustomers])


  const getItemUnitPrice = (item: CartItem) => {
    const pr = item.product || ({} as any)
    const isBW = (item.color || '').toUpperCase() === 'BLACK' || (item.color || '').toUpperCase() === 'WHITE'
    const p_bw = typeof pr.price_bw === 'number' ? pr.price_bw : parseFloat(String(pr.price_bw || 0))
    const p_col = typeof pr.price_colored === 'number' ? pr.price_colored : parseFloat(String(pr.price_colored || 0))
    const p_gen = typeof (pr as any).price === 'number' ? (pr as any).price : parseFloat(String((pr as any).price || 0))
    const i_p = typeof (item as any).price === 'number' ? (item as any).price : parseFloat(String((item as any).price || 0))
    return (isBW ? (p_bw || p_gen) : (p_col || p_bw || p_gen)) || i_p || 0
  }

  const updateCartDiscount = (index: number, val: number | string) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, discount: val } : item))
  }
  const updateCartQty = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
  }
  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const subtotal = cart.reduce((acc, item) => {
    const up = getItemUnitPrice(item)
    return acc + up * item.qty
  }, 0)

  const totalDiscount = cart.reduce((acc, item) => {
    const up = getItemUnitPrice(item)
    return acc + up * item.qty * (Number(item.discount) || 0) / 100
  }, 0)

  const netAmount = subtotal - totalDiscount
  const vat = netAmount * 0.15
  const grandTotal = netAmount + vat

  const handleCreateCustomer = () => {
    const created: CustomerInfo = {
      id: 'new-' + Date.now(),
      name: newCustomer.name,
      contact_person: newCustomer.contact_person,
      mobile_no: newCustomer.mobile_no,
      email: newCustomer.email,
      address: newCustomer.address,
      vat_no: newCustomer.vat,
      cr_no: newCustomer.cr,
      orders: 0
    }
    setSelectedCustomer(created)
    setShowNewCustomerForm(false)
    addCustomer(created)
  }

  const handleGenerateQuotation = () => {
    const maxDiscount = cart.reduce((max, item) => Math.max(max, Number(item.discount) || 0), 0)
    const effectiveSalesperson = displayName || 'Ahmad Al Rashid'
    // Discount strictly above 25% requires Admin Approval (25% itself is auto-approved)
    const newStatus = maxDiscount > 25 ? 'Pending Approval' : 'Quotation Generated'
    const newId = 'QT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)
    
    // Deduct stock for each cart item
    cart.forEach(item => {
      deductStock(item.product.id, item.color, item.qty)
    })

    // Build quotation data and navigate to the preview page
    const quotationData = {
      id: newId,
      customer: selectedCustomer,
      items: cart,
      subtotal,
      totalDiscount,
      netAmount,
      vat,
      grandTotal,
      remarks,
      visitDate,
      visitTime,
      visitPurpose,
      salesperson: effectiveSalesperson,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: newStatus,
      paymentTerms: paymentTerms ? `Net ${paymentTerms} Days` : 'Cash / Advance',
    }
    // Save to global context (syncs to Supabase & Realtime)
    addQuotation({
      id: newId,
      customerName: selectedCustomer?.name || 'Unknown',
      salesperson: effectiveSalesperson,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      discount: maxDiscount,          // max discount % (used for approval logic)
      discount_total: totalDiscount,  // total SAR discount amount
      subtotal,
      vat_amount: vat,
      grandTotal,
      status: newStatus,
      items: cart,
      remarks,
      paymentTerms: paymentTerms ? `Net ${paymentTerms} Days` : 'Cash / Advance',
    })

    // Dispatch real-time notification to Admin & Salesperson
    if (newStatus === 'Pending Approval') {
      addNotification({
        type: 'pending_approval',
        targetRole: 'admin',
        title: 'Discount Approval Required',
        message: `${effectiveSalesperson} requested a ${maxDiscount}% discount on quotation ${newId} for ${selectedCustomer?.name || 'Customer'} (SAR ${grandTotal.toFixed(2)}).`,
        quotationId: newId,
        customerName: selectedCustomer?.name,
        salespersonName: effectiveSalesperson,
        link: '/admin/approvals',
      })
      addNotification({
        type: 'pending_approval',
        targetRole: 'salesperson',
        title: 'Sent for Admin Approval',
        message: `Quotation ${newId} (${maxDiscount}% discount) has been submitted to Admin for approval.`,
        quotationId: newId,
        customerName: selectedCustomer?.name,
        salespersonName: effectiveSalesperson,
        link: '/quotations',
      })
    } else {
      addNotification({
        type: 'quotation_created',
        targetRole: 'admin',
        title: 'New Quotation Created',
        message: `${effectiveSalesperson} generated quotation ${newId} for ${selectedCustomer?.name || 'Customer'} (SAR ${grandTotal.toFixed(2)}).`,
        quotationId: newId,
        customerName: selectedCustomer?.name,
        salespersonName: effectiveSalesperson,
        link: '/admin/quotations',
      })
      addNotification({
        type: 'quotation_created',
        targetRole: 'salesperson',
        title: 'Quotation Generated',
        message: `Quotation ${newId} for ${selectedCustomer?.name || 'Customer'} was created successfully.`,
        quotationId: newId,
        customerName: selectedCustomer?.name,
        salespersonName: effectiveSalesperson,
        link: '/quotations',
      })
    }

    // Store in sessionStorage for the preview page
    sessionStorage.setItem('quotation_data', JSON.stringify(quotationData))
    router.push('/quotations/preview')
  }

  const filteredCustomers = globalCustomers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.contact_person.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.mobile_no.includes(customerSearch)
  )

  const stepLabels = ['Customer', 'Products', 'Generate']

  return (
    <div className="space-y-6 pb-24 relative" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{ar ? 'عرض سعر جديد' : 'New Quotation'}</h2>
          <p className="text-muted-foreground">
            {ar ? `الخطوة ${step} من 3 — ` : `Step ${step} of 3 — `}
            {step === 1 ? (ar ? 'اختر العميل' : 'Select Customer') : step === 2 ? (ar ? 'اختر المنتجات' : 'Select Products') : (ar ? 'مراجعة وإنشاء' : 'Review & Generate')}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <X className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {ar ? 'إلغاء' : 'Cancel'}
        </Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1
          const isCompleted = step > stepNum
          const isActive = step === stepNum
          return (
            <div key={label} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' :
                    isActive ? 'bg-white border-blue-600 text-blue-600' :
                      'bg-white border-slate-300 text-slate-400'
                  }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                <span className={`text-sm font-medium ${isActive || isCompleted ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${step > stepNum ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
              )}
            </div>
          )
        })}
      </div>

      {/* ========== STEP 1: SELECT CUSTOMER ========== */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Search Existing Customer */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="w-4 h-4" /> {ar ? 'البحث عن عميل حالي' : 'Search Existing Customer'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedCustomer ? (
                <>
                  <div className="relative max-w-md">
                    <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
                    <Input
                      placeholder={ar ? 'اكتب اسم الشركة، جهة الاتصال، أو الهاتف...' : 'Type company name, contact person, or phone...'}
                      className={isRtl ? 'pr-9' : 'pl-9'}
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>
                  {customerSearch && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-900 transition-colors"
                          onClick={() => { setSelectedCustomer(c); setCustomerSearch('') }}
                        >
                          <span className="font-semibold text-sm">{c.name}</span>
                          <span className="text-sm text-muted-foreground ml-3">{c.contact_person} • {c.mobile_no}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{selectedCustomer.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedCustomer.contact_person} • {selectedCustomer.mobile_no}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>{ar ? 'تغيير' : 'Change'}</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OR Divider */}
          {!selectedCustomer && (
            <>
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                <span className="relative bg-slate-50 dark:bg-slate-950 px-4 text-sm text-muted-foreground">{ar ? 'أو' : 'OR'}</span>
              </div>

              {/* New Customer */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                >
                  <UserPlus className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {ar ? 'عميل جديد' : 'New Customer'}
                </Button>
              </div>
            </>
          )}

          {/* Inline New Customer Form */}
          {showNewCustomerForm && !selectedCustomer && (
            <Card className="border shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-4 py-2.5 rounded-lg font-medium">
                  {ar ? '● العميل غير موجود — أنشئ عميلاً جديداً أدناه' : '● Customer not found — Create new customer below'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">{ar ? 'اسم الشركة (إنجليزي)' : 'Company Name (English)'} *</Label>
                    <Input placeholder="e.g. ABC Trading" value={newCustomer.name} onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))} dir="ltr" />
                  </div>
                  <div>
                    <Label className="font-semibold">{ar ? 'اسم الشركة (عربي)' : 'Company Name (Arabic)'}</Label>
                    <Input placeholder="مثال: شركة أ ب ت" dir="rtl" />
                  </div>
                  <div>
                    <Label className="font-semibold">{ar ? 'جهة الاتصال' : 'Contact Person'} *</Label>
                    <Input placeholder={ar ? 'مثال: أحمد' : 'e.g. John Tan'} value={newCustomer.contact_person} onChange={e => setNewCustomer(p => ({ ...p, contact_person: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="font-semibold">{ar ? 'الجوال' : 'Phone'} *</Label>
                    <Input placeholder="+966 XXXX XXXX" value={newCustomer.mobile_no} onChange={e => setNewCustomer(p => ({ ...p, mobile_no: e.target.value }))} dir="ltr" />
                  </div>
                  <div>
                    <Label>{ar ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <Input placeholder="email@company.sa" value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} dir="ltr" />
                  </div>
                  <div>
                    <Label>{ar ? 'الرقم الضريبي' : 'Customer VAT Number'}</Label>
                    <Input placeholder={ar ? 'مثال: 310123456700003' : 'e.g. 310123456700003'} value={newCustomer.vat} onChange={e => setNewCustomer(p => ({ ...p, vat: e.target.value }))} dir="ltr" />
                  </div>
                  <div>
                    <Label>{ar ? 'السجل التجاري' : 'Customer CR Number'}</Label>
                    <Input placeholder={ar ? 'مثال: 1010123456789' : 'e.g. 1010123456789'} value={newCustomer.cr} onChange={e => setNewCustomer(p => ({ ...p, cr: e.target.value }))} dir="ltr" />
                  </div>
                </div>
                <div>
                  <Label>{ar ? 'العنوان' : 'Address'}</Label>
                  <Input placeholder={ar ? 'العنوان الكامل' : 'Full address'} value={newCustomer.address} onChange={e => setNewCustomer(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div>
                  <Label>{ar ? 'ملاحظات' : 'Notes'}</Label>
                  <textarea
                    className="w-full border rounded-lg p-3 text-sm min-h-[80px] bg-white dark:bg-slate-900"
                    placeholder={ar ? 'أي ملاحظات خاصة...' : 'Any special notes...'}
                    value={newCustomer.notes}
                    onChange={e => setNewCustomer(p => ({ ...p, notes: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3">
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateCustomer} disabled={!newCustomer.name || !newCustomer.contact_person || !newCustomer.mobile_no}>
                    <Check className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {ar ? 'إضافة عميل والمتابعة' : 'Add Customer & Continue'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewCustomerForm(false)}>{ar ? 'إلغاء' : 'Cancel'}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visit Details */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                📋 {ar ? 'تفاصيل الزيارة' : 'Visit Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">{ar ? 'تاريخ الزيارة' : 'Visit Date'}</Label>
                  <Input type="date" value={new Date().toISOString().split('T')[0]} onChange={() => { }} />
                </div>
                <div>
                  <Label className="font-semibold">{ar ? 'وقت الزيارة' : 'Visit Time'}</Label>
                  <Input type="time" value={new Date().toTimeString().slice(0, 5)} onChange={() => { }} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">{ar ? 'الغرض' : 'Purpose'}</Label>
                  <select
                    className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-900 mt-1"
                    value={visitPurpose}
                    onChange={(e) => setVisitPurpose(e.target.value)}
                  >
                    <option>{ar ? 'طلب جديد' : 'New Order'}</option>
                    <option>{ar ? 'متابعة' : 'Follow-up'}</option>
                    <option>{ar ? 'عرض منتج' : 'Product Demo'}</option>
                    <option>{ar ? 'استفسار' : 'Inquiry'}</option>
                    <option>{ar ? 'شكوى' : 'Complaint'}</option>
                  </select>
                </div>
                <div>
                  <Label className="font-semibold">{ar ? 'شروط الدفع (أيام)' : 'Payment Terms (Days)'}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min={0}
                      placeholder={ar ? 'مثال: 30' : 'e.g. 30'}
                      value={paymentTerms}
                      onChange={e => setPaymentTerms(e.target.value)}
                      className="w-28"
                      dir="ltr"
                    />
                    {paymentTerms && (
                      <span className="text-xs text-slate-500 font-medium">
                        → Net {paymentTerms} Days
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="flex justify-start">
            <Button
              className="bg-blue-600 hover:bg-blue-700 px-8"
              disabled={!selectedCustomer}
              onClick={() => setStep(2)}
            >
              <ArrowRight className={`w-4 h-4 ${isRtl ? 'ml-2 rotate-180' : 'mr-2'}`} /> {ar ? 'المتابعة للمنتجات' : 'Continue to Products'}
            </Button>
          </div>
        </div>
      )}

      {/* ========== STEP 2: SELECT PRODUCTS ========== */}
      {step === 2 && (
        <div className="space-y-4">
          <ProductCatalog
            initialCart={cart}
            onProceedToQuotation={(cartItems) => {
              setCart(cartItems)
              setStep(3)
            }}
            onCartChange={(items) => setCatalogCartItems(items)}
          />
          <div className="pt-2 flex justify-between items-center">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customer
            </Button>
            {catalogCartItems.length > 0 && (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                setCart(catalogCartItems)
                setStep(3)
              }}>
                <ArrowRight className="w-4 h-4 mr-2" /> Review & Generate
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ========== STEP 3: REVIEW & GENERATE ========== */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                  {selectedCustomer?.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">{selectedCustomer?.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedCustomer?.contact_person} • {selectedCustomer?.mobile_no}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Change</Button>
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cart Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{item.product.name_en} • {item.color}</div>
                    <div className="text-xs text-muted-foreground">SKU: {item.product.sku} • SAR {getItemUnitPrice(item).toFixed(2)} each</div>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-muted-foreground">Discount</span>
                      <div className="flex items-center border rounded px-1.5 py-0.5 w-16 bg-white dark:bg-slate-900">
                        <input type="number" className="w-full bg-transparent outline-none text-right text-xs" value={item.discount !== undefined ? item.discount : 0}
                          onChange={e => updateCartDiscount(idx, e.target.value === '' ? '' : Number(e.target.value))}
                          onFocus={e => {
                            if (item.discount === 0 || item.discount === undefined) {
                              updateCartDiscount(idx, '')
                            }
                          }}
                          onBlur={e => { if (e.target.value === '') updateCartDiscount(idx, 0) }} />
                        <span className="ml-0.5 text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border rounded">
                    <button className="px-2 py-1.5 hover:bg-slate-50" onClick={() => updateCartQty(idx, -1)}><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                    <button className="px-2 py-1.5 hover:bg-slate-50" onClick={() => updateCartQty(idx, 1)}><Plus className="w-3 h-3" /></button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className="font-bold">SAR {(getItemUnitPrice(item) * item.qty).toFixed(2)}</div>
                  </div>
                  <button onClick={() => removeFromCart(idx)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">SAR {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-red-500"><span>Discount</span><span>-SAR {totalDiscount.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Net Amount</span><span className="font-bold">SAR {netAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-muted-foreground"><span>VAT (15%)</span><span>SAR {vat.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Grand Total</span><span>SAR {grandTotal.toFixed(2)}</span></div>
              </div>

              {/* Discount Approval Warning */}
              {cart.some(item => Number(item.discount) > 25) && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-start gap-3">
                  <span className="text-orange-500 text-lg mt-0.5">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-orange-800">Admin Approval Required</p>
                    <p className="text-xs text-orange-700 mt-0.5">One or more items have a discount above <strong>25%</strong>. This quotation will be sent to Admin for approval before it can be processed.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Remarks & Attachments */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Remarks & Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-semibold">Order Remarks</Label>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm min-h-[80px] bg-white dark:bg-slate-900 mt-1"
                  placeholder="Any special instructions..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
              <div>
                <Label className="font-semibold text-muted-foreground">Attach Photos (optional)</Label>
                <div className="mt-1 border-2 border-dashed rounded-xl p-8 text-center hover:border-blue-300 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-sm text-blue-600 font-medium">Click to upload <span className="text-muted-foreground font-normal">or drag and drop</span></p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Nav */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Continue Shopping
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 px-8" onClick={handleGenerateQuotation}>
              <ArrowRight className="w-4 h-4 mr-2" /> Review & Generate Quotation
            </Button>
          </div>
        </div>
      )}

      {/* Notification Popup */}
      {showPopup && (
        <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">✓</div>
            <p className="font-medium">{popupMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewQuotationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <NewQuotationContent />
    </Suspense>
  )
}
