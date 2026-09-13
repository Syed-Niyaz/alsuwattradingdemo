'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Circle, ArrowLeft, FileText, Download, MessageCircle, Truck, Pencil, Clock } from 'lucide-react'
import Link from 'next/link'

const STATUS_STEPS = ['Draft', 'Quotation Generated', 'Quotation Sent', 'Completed', 'Converted']
const STATUS_INDEX: Record<string, number> = {
  'Draft': 0,
  'Quotation Generated': 1,
  'Quotation Sent': 2,
  'Customer Accepted': 3,
  'Completed': 3,
  'Converted': 4,
  'Rejected': -1, // special
}

const TERMS = [
  'We are committed to supplying products as per the approved sample. In case of any quality discrepancy, the company will accept the return of the products without any additional charges.',
  'If the delivered products do not meet the agreed quality standards, the company will replace them accordingly.',
  'Any complaints regarding the product must be registered within 7 Days of delivery.',
  'The company will not entertain any claims made after three (3) days from the date of delivery.',
  'Delivery of products will only be made if previously agreed upon.',
]

export default function QuotationPreviewPage() {
  const router = useRouter()
  const [quotation, setQuotation] = useState<any>(null)
  const [showPremiumPopup, setShowPremiumPopup] = useState(false)
  const [paymentDays, setPaymentDays] = useState<number | string>(30)
  const [isAlreadyGenerated, setIsAlreadyGenerated] = useState(false)

  useEffect(() => {
    const data = sessionStorage.getItem('quotation_data')
    if (data) {
      const parsed = JSON.parse(data)
      setQuotation(parsed)
      if (sessionStorage.getItem('quotation_generated') === parsed.id) {
        setIsAlreadyGenerated(true)
      }
    }
  }, [])

  if (!quotation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">No Quotation Data</h2>
          <p className="text-muted-foreground mb-4">Please create a new quotation first.</p>
          <Link href="/quotations/new"><Button className="bg-blue-600 hover:bg-blue-700">Create Quotation</Button></Link>
        </div>
      </div>
    )
  }

  const handleCreateDeliveryNote = () => {
    sessionStorage.setItem('quotation_data', JSON.stringify(quotation))
    router.push('/quotations/delivery')
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-blue-600 hover:underline">Briefcase</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">Quotation Preview</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Review & Generate Quotation</h2>
          <p className="text-muted-foreground">Step 3 of 3 — Review and generate quotation</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
        </Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {['Customer', 'Products', 'Generate'].map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                i < 2 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-600 text-blue-600'
              }`}>
                {i < 2 ? <Check className="w-4 h-4" /> : 3}
              </div>
              <span className="text-sm font-medium text-blue-600">{label}</span>
            </div>
            {i < 2 && <div className="flex-1 h-0.5 mx-4 bg-blue-600"></div>}
          </div>
        ))}
      </div>

      {/* Status Pipeline */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">⚡ Status Process</CardTitle>
        </CardHeader>
        <CardContent>
          {quotation.status === 'Rejected' ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-red-500 text-white border-red-500">
                <Check className="w-3 h-3" /> Quotation Sent
              </div>
              <div className="w-6 h-0.5 bg-red-400" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-red-100 text-red-700 border-red-300">
                <Circle className="w-3 h-3" /> Customer Rejected
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-0 flex-wrap">
              {STATUS_STEPS.map((s, i) => {
                const activeStatus = STATUS_INDEX[quotation.status] ?? 1
                const active = i <= activeStatus
                const done = i < activeStatus
                return (
                  <div key={s} className="flex items-center">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                      active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'
                    }`}>
                      {done ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                      {s}
                    </div>
                    {i < STATUS_STEPS.length - 1 && <div className={`w-6 h-0.5 ${done ? 'bg-blue-600' : 'bg-slate-200'}`} />}
                  </div>
                )
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">This allows the salesperson to see the live quotation.</p>
        </CardContent>
      </Card>

      {/* Customer */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">👤 Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-lg text-blue-700 dark:text-blue-400">{quotation.customer?.name}</div>
          <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
            <div>{quotation.customer?.contact_person} • {quotation.customer?.mobile_no}</div>
            <div>{quotation.customer?.email}</div>
            <div>{quotation.customer?.address}</div>
          </div>
        </CardContent>
      </Card>

      {/* Quotation Items Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">📦 Quotation Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-blue-50 dark:bg-blue-900/20">
                  <th className="px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-300">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-300">PRODUCT</th>
                  <th className="px-4 py-3 text-center font-semibold text-blue-800 dark:text-blue-300">QTY</th>
                  <th className="px-4 py-3 text-center font-semibold text-blue-800 dark:text-blue-300">UNIT PRICE</th>
                  <th className="px-4 py-3 text-center font-semibold text-blue-800 dark:text-blue-300">DISCOUNT</th>
                  <th className="px-4 py-3 text-right font-semibold text-blue-800 dark:text-blue-300">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quotation.items.map((item: any, idx: number) => {
                  const isBW = (item.color || "").toUpperCase() === "BLACK" || (item.color || "").toUpperCase() === "WHITE";
                  const p_bw = parseFloat(item.product?.price_bw || "0");
                  const p_col = parseFloat(item.product?.price_colored || "0");
                  const p_gen = parseFloat(item.product?.price || "0");
                  const i_price = parseFloat(item.price || "0");
                  const basePrice = (isBW ? (p_bw || p_gen) : (p_col || p_bw || p_gen)) || i_price || 0;
                  const discount = parseFloat(item.discount || "0");
                  const finalAmount = basePrice * item.qty * (1 - discount / 100) * 1.15;
                  
                  return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{item.product.name_en} • {item.color}</div>
                      <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-center">{item.qty}</td>
                    <td className="px-4 py-3 text-center">SAR {basePrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">{discount > 0 ? `${discount}%` : '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">SAR {finalAmount.toFixed(2)}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t pt-4 mt-4 space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-medium">SAR {quotation.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-red-500"><span>Discount</span><span>-SAR {quotation.totalDiscount.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Net Amount</span><span className="font-bold">SAR {quotation.netAmount.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-muted-foreground"><span>VAT (15%)</span><span>SAR {quotation.vat.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t text-blue-700"><span>Grand Total</span><span>SAR {quotation.grandTotal.toFixed(2)}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Remarks */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">📝 Remarks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{quotation.remarks || 'No remarks provided.'}</p>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">📜 Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm font-semibold">Payment Terms</Label>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>Net</span>
              <input
                type="number"
                min={0}
                value={paymentDays}
                onChange={e => setPaymentDays(e.target.value === '' ? '' : Number(e.target.value))}
                onFocus={e => { if (paymentDays === 0 || paymentDays === '') setPaymentDays('') }}
                onBlur={e => { if (e.target.value === '') setPaymentDays(30) }}
                className="border rounded px-2 py-0.5 bg-white dark:bg-slate-900 font-mono w-16 text-center text-sm outline-none focus:ring-1 focus:ring-blue-400"
              />
              <span>Days from Invoice Date</span>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-lg p-4">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Standard Terms & Conditions</p>
            <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1.5 list-disc list-inside">
              {TERMS.map((t, i) => <li key={i}>{t}</li>)}
              <li>Payment Terms: Net {paymentDays} Days from Invoice Date.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/quotations/new?edit=true')}>
          <Pencil className="w-4 h-4 mr-2" /> Edit Quotation
        </Button>
        {isAlreadyGenerated ? (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
            const paymentTermsStr = paymentDays !== '' ? `Net ${paymentDays} Days` : 'Cash / Advance'
            const updatedQuotation = { ...quotation, paymentTerms: paymentTermsStr }
            sessionStorage.setItem('quotation_data', JSON.stringify(updatedQuotation))
            router.push('/quotations/document')
          }}>
            <FileText className="w-4 h-4 mr-2" /> View Quotation
          </Button>
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
            const existing = localStorage.getItem('my_quotations')
            const quotes = existing ? JSON.parse(existing) : []
            const exists = quotes.some((q: any) => q.id === quotation.id)
            
            // Save paymentTerms into the quotation data for the document page
            const paymentTermsStr = paymentDays !== '' ? `Net ${paymentDays} Days` : 'Cash / Advance'
            const updatedQuotation = { ...quotation, paymentTerms: paymentTermsStr }
            sessionStorage.setItem('quotation_data', JSON.stringify(updatedQuotation))
            sessionStorage.setItem('quotation_generated', quotation.id)
            setIsAlreadyGenerated(true)
            
            if (!exists) {
              localStorage.setItem('my_quotations', JSON.stringify([updatedQuotation, ...quotes]))
            }
            
            setShowPremiumPopup(true)
            setTimeout(() => {
              router.push('/quotations/document')
            }, 2500)
          }}>
            <FileText className="w-4 h-4 mr-2" /> Generate Quotation
          </Button>
        )}
      </div>

      {showPremiumPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="relative w-24 h-24 mb-6">
              <div className={`absolute inset-0 rounded-full animate-[scale-in_0.5s_ease-out_forwards] ${quotation.status === 'Pending Approval' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {quotation.status === 'Pending Approval' ? (
                  <Clock className="w-12 h-12 text-white animate-[draw-check_0.5s_ease-out_0.2s_both] stroke-[3]" />
                ) : (
                  <Check className="w-12 h-12 text-white animate-[draw-check_0.5s_ease-out_0.2s_both] stroke-[3]" />
                )}
              </div>
              <div className={`absolute inset-0 rounded-full border-4 opacity-0 animate-[ping-large_1s_ease-out_0.3s_forwards] ${quotation.status === 'Pending Approval' ? 'border-amber-500' : 'border-green-500'}`}></div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 animate-[fade-in-up_0.5s_ease-out_0.5s_both]">
              {quotation.status === 'Pending Approval' ? 'Pending Approval!' : 'Quotation Generated!'}
            </h3>
            <p className="text-slate-500 text-sm mt-2 animate-[fade-in-up_0.5s_ease-out_0.6s_both]">
              {quotation.status === 'Pending Approval' ? 'Sent to Admin for approval' : 'Successfully saved'}
            </p>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes scale-in {
              0% { transform: scale(0); }
              70% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
            @keyframes draw-check {
              0% { clip-path: inset(0 100% 0 0); }
              100% { clip-path: inset(0 0 0 0); }
            }
            @keyframes ping-large {
              0% { transform: scale(1); opacity: 0.8; }
              100% { transform: scale(1.6); opacity: 0; }
            }
            @keyframes fade-in-up {
              0% { opacity: 0; transform: translateY(10px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}} />
        </div>
      )}

    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={`text-sm font-medium block mb-1 ${className || ''}`}>{children}</label>
}
