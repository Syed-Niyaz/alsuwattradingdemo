'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Printer, MessageCircle, RefreshCw } from 'lucide-react'
import { generateQuotationPDF, shareQuotationViaWhatsApp } from '@/lib/pdf-download'
import { createClient } from '@/lib/supabase/client'

const TERMS = [
  'We are committed to supplying products as per the approved sample. In case of any quality discrepancy, the company will accept the return of the products without any additional charges.',
  'If the delivered products do not meet the agreed quality standards, the company will replace them accordingly.',
  'Any complaints regarding the product must be registered within 7 Days of delivery.',
  'The company will not entertain any claims made after three (3) days from the date of delivery.',
  'Delivery of products will only be made if previously agreed upon.',
]

const DEFAULT_INVOICE = {
  id: 'QT-2024-0046',
  date: '18 Dec 2024',
  salesperson: 'Ahmad Al Rashid',
  customer: {
    name: 'Raha Kitchen Solutions',
    contact_person: 'Raha Kitchen Solutions',
    mobile_no: '+966 13 812 3456',
    email: 'khalid@raha.com',
    address: 'King Fahd Road, Dammam, KSA',
  },
  items: [
    { name: 'Dinner Plate 11" (White)', sku: 'DP-110', price: 64.40, color: 'White', qty: 4, discount: 0, amount: 257.60, finalInSar: 257.60 },
    { name: 'Deep Plate 9" (White)', sku: 'DP-090', price: 29.90, color: 'White', qty: 1, discount: 0, amount: 29.90, finalInSar: 29.90 },
  ],
  subtotal: 287.50,
  vat: 43.13,
  grandTotal: 287.50,
  paymentTerms: '30 Days',
}

function InvoiceDownloadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quotationId = searchParams.get('id')
  const rawEncodedData = searchParams.get('data')

  const [quotation, setQuotation] = useState<any>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Try to load from URL encoded data (publicly shareable anywhere)
    if (rawEncodedData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(rawEncodedData))))
        setQuotation(decoded)
        setLoading(false)
        return
      } catch (e) {
        console.error('Error decoding invoice url data:', e)
      }
    }

    // 2. Try to fetch from Supabase by quotation ID if provided in URL
    if (quotationId) {
      const fetchFromSupabase = async () => {
        try {
          const supabase = createClient()
          if (supabase) {
            const { data, error } = await supabase
              .from('quotations')
              .select(`
                id,
                quotation_number,
                date,
                subtotal,
                vat_amount,
                net_amount,
                payment_terms,
                remarks,
                customer:customers(name, contact_person, mobile_no, email, address),
                salesperson:profiles(full_name),
                items:quotation_items(
                  id,
                  quantity,
                  unit_price,
                  unit_price_snapshot,
                  discount_percentage,
                  line_amount,
                  color,
                  product:products(name_en, sku, price_bw, price_colored)
                )
              `)
              .or(`id.eq.${quotationId},quotation_number.eq.${quotationId}`)
              .maybeSingle()

            if (data && !error) {
              const formatted = {
                id: (data as any).quotation_number || data.id,
                date: (data as any).date || '18 Dec 2024',
                salesperson: (data as any).salesperson?.full_name || 'Ahmad Al Rashid',
                paymentTerms: (data as any).payment_terms || '30 Days',
                customer: (data as any).customer || DEFAULT_INVOICE.customer,
                items: (data as any).items?.map((it: any) => ({
                  name: it.product?.name_en || 'Melamine Product',
                  sku: it.product?.sku || 'SKU-100',
                  price: parseFloat(it.unit_price_snapshot || it.unit_price || '25.00'),
                  qty: it.quantity || 1,
                  discount: parseFloat(it.discount_percentage || '0'),
                  finalInSar: parseFloat(it.line_amount || '0'),
                })) || DEFAULT_INVOICE.items,
                subtotal: parseFloat((data as any).subtotal || '250.00'),
                vat: parseFloat((data as any).vat_amount || '37.50'),
                grandTotal: parseFloat((data as any).net_amount || '287.50'),
              }
              setQuotation(formatted)
              setLoading(false)
              return
            }
          }
        } catch (err) {
          console.error('Error fetching quotation by ID:', err)
        }

        // Check local storage quotations array
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('my_quotations')
          if (stored) {
            try {
              const quotes = JSON.parse(stored)
              const match = quotes.find((q: any) => q.id === quotationId)
              if (match) {
                setQuotation(match)
                setLoading(false)
                return
              }
            } catch {}
          }
        }
      }

      fetchFromSupabase()
    }

    // 3. Fallback to sessionStorage (salesperson active session)
    if (typeof window !== 'undefined') {
      const data = sessionStorage.getItem('quotation_data')
      if (data) {
        try {
          setQuotation(JSON.parse(data))
          setLoading(false)
          return
        } catch {}
      }
    }

    // 4. Default fallback
    setQuotation(DEFAULT_INVOICE)
    setLoading(false)
  }, [quotationId, rawEncodedData])

  if (loading || !quotation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-slate-600 font-semibold">Loading Official Invoice...</p>
        </div>
      </div>
    )
  }

  const custName = typeof quotation.customer === 'string' ? quotation.customer : (quotation.customer?.name || 'Customer Name')
  const custContact = quotation.customer?.contact_person || quotation.customer?.contact || custName
  const custPhone = quotation.customer?.mobile_no || quotation.customer?.phone || 'N/A'
  const custEmail = quotation.customer?.email || 'N/A'
  const custAddress = quotation.customer?.address || 'N/A'
  const dateStr = quotation.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const salespersonStr = quotation.salesperson || 'Ahmad Al Rashid'
  const rawPaymentTerms = quotation.paymentTerms || '30 Days'
  const paymentTermsStr = rawPaymentTerms.replace(/^Net\s+/i, '')

  const rawItems = (quotation.items && quotation.items.length > 0) ? quotation.items : DEFAULT_INVOICE.items

  const formattedItems = rawItems.map((item: any) => {
    const name = item.product?.name_en || item.name || 'Melamine Item'
    const sku = item.product?.sku || item.sku || 'SKU-100'

    const isBW = (item.color || '').toUpperCase() === 'BLACK' || (item.color || '').toUpperCase() === 'WHITE'
    const p_bw = parseFloat(item.product?.price_bw || '0')
    const p_col = parseFloat(item.product?.price_colored || '0')
    const p_gen = parseFloat(item.product?.price || '0')
    const i_price = parseFloat(item.price || '0')
    const basePrice = (isBW ? (p_bw || p_gen) : (p_col || p_bw || p_gen)) || i_price || 25.00

    const qty = parseInt(item.qty, 10) || 1
    const discount = parseFloat(item.discount || '0') || 0
    const finalUnitPrice = basePrice * (1 - discount / 100) * 1.15
    const finalInSar = item.finalInSar ?? item.amount ?? (finalUnitPrice * qty)

    return {
      name,
      sku,
      price: finalUnitPrice,
      qty,
      discount,
      finalInSar,
    }
  })

  const calculatedTotal = formattedItems.reduce((acc: number, i: any) => acc + i.finalInSar, 0)
  const grandTotal = quotation.grandTotal ?? calculatedTotal

  // Direct 1-Click PDF Download
  const handleDownloadPDF = () => {
    setIsDownloading(true)
    try {
      generateQuotationPDF({
        id: quotation.id || 'QT-2024-0046',
        date: dateStr,
        salesperson: salespersonStr,
        paymentTerms: paymentTermsStr,
        customer: {
          name: custName,
          contact_person: custContact,
          mobile_no: custPhone,
          email: custEmail,
          address: custAddress,
        },
        items: formattedItems,
        subtotal: quotation.subtotal || grandTotal / 1.15,
        vat: quotation.vat || (grandTotal / 1.15) * 0.15,
        grandTotal,
      })
    } catch (e) {
      console.error('Download error:', e)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSendWhatsApp = async () => {
    await shareQuotationViaWhatsApp({
      id: quotation.id || 'QT-2024-0046',
      date: dateStr,
      salesperson: salespersonStr,
      paymentTerms: paymentTermsStr,
      customer: {
        name: custName,
        contact_person: custContact,
        mobile_no: custPhone,
        email: custEmail,
        address: custAddress,
      },
      items: formattedItems,
      subtotal: quotation.subtotal || grandTotal / 1.15,
      vat: quotation.vat || (grandTotal / 1.15) * 0.15,
      grandTotal,
    }, custPhone)
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:bg-white print:p-0">
      {/* Standalone Control Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-md border print:hidden">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="text-slate-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Downloading PDF...' : 'Download Invoice PDF'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="bg-white text-slate-700 hover:bg-slate-50"
          >
            <Printer className="w-4 h-4 mr-2" /> Print Invoice
          </Button>

          <Button
            size="sm"
            onClick={handleSendWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Send WhatsApp
          </Button>
        </div>
      </div>

      {/* Complete Exact Document (Standalone) */}
      <div
        id="invoice-document-content"
        className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-full"
      >
        {/* Full Header with Official Alsuwat Group Logo */}
        <div className="bg-white px-8 pt-6 pb-0">
          <div className="flex items-start gap-5">
            {/* Logo */}
            <div
              style={{
                width: 90,
                height: 90,
                flexShrink: 0,
                border: '1.5px solid #c8c8c8',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f7fa',
                gap: 2,
              }}
            >
              <svg width="44" height="38" viewBox="0 0 44 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="22,2 42,36 2,36" fill="#1a3a6b" />
                <polygon points="22,10 36,34 8,34" fill="#2563a8" opacity="0.45" />
              </svg>
              <span style={{ fontSize: 7, fontWeight: 700, color: '#1a3a6b', letterSpacing: 0.5, textAlign: 'center', lineHeight: 1.3 }}>
                مجموعة السواط<br />
                <span style={{ color: '#1a3a6b', fontWeight: 800 }}>ALSUWAT GROUP</span>
              </span>
            </div>

            {/* Company Info Block */}
            <div style={{ paddingTop: 2, paddingLeft: 30, flex: 1 }}>
              <h1
                style={{
                  fontFamily: '"Times New Roman", Georgia, serif',
                  fontSize: 23,
                  fontWeight: 700,
                  color: '#111111',
                  lineHeight: 1.15,
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                Waleed Mohammed Alsuwat Company Holding
              </h1>
              <p
                style={{
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontSize: 11,
                  color: '#1a3a6b',
                  marginTop: 6,
                  lineHeight: 1.5,
                  textAlign: 'center',
                  maxWidth: 500,
                  margin: '6px auto 0',
                }}
              >
                NJRC Building, 2<sup style={{ fontSize: 8 }}>nd</sup> Floor, Office no 5, Near Al Bassam Tower, Street Al
                {' '}Amir Mohammad <span style={{ textDecoration: 'underline' }}>Bin</span> Saud, P.O Box 7431, Zip Code 32241, Dammam,
                {' '}Eastern Zone, Kingdom of Saudi Arabia.{' '}
                <strong style={{ fontWeight: 700 }}>www.alsuwatlogistics.com</strong>
              </p>
            </div>
          </div>

          {/* Maroon bar */}
          <div
            style={{
              marginTop: 14,
              height: 3,
              background: 'linear-gradient(to right, #6b0000 0%, #8b1a1a 40%, #6b0000 100%)',
              borderRadius: 1,
            }}
          />
          {/* Gold accent */}
          <div style={{ height: 1.5, background: '#c8a97e', marginBottom: 0 }} />
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-4 border-b text-xs">
          <div className="p-3 border-r bg-slate-50"><span className="font-semibold text-slate-500 block">DATE</span>{dateStr}</div>
          <div className="p-3 border-r bg-slate-50"><span className="font-semibold text-slate-500 block">VALID UNTIL</span>10 Days</div>
          <div className="p-3 border-r bg-slate-50"><span className="font-semibold text-slate-500 block">SALES PERSON</span>{salespersonStr}</div>
          <div className="p-3 bg-slate-50"><span className="font-semibold text-slate-500 block">PAYMENT TERMS</span>{paymentTermsStr}</div>
        </div>

        {/* BILL TO */}
        <div className="p-6 border-b">
          <p className="text-xs font-semibold text-red-600 uppercase mb-2 tracking-wider">BILL TO:</p>
          <p className="font-bold text-lg text-slate-900">{custName}</p>
          <div className="text-sm text-slate-600 space-y-0.5 mt-1">
            <div>Contact: {custContact}</div>
            <div>Address: {custAddress}</div>
            <div>Tel: {custPhone}</div>
            <div>Email: {custEmail}</div>
          </div>
        </div>

        {/* Products Table (Renders all products up to 1,000 items) */}
        <div className="px-6 py-4">
          <table className="w-full text-xs border-collapse border border-black" style={{ fontFamily: '"Times New Roman", Georgia, serif', fontSize: '12.5px' }}>
            <thead>
              <tr className="text-black font-bold" style={{ backgroundColor: '#b4c6e7' }}>
                <th className="px-2 py-1.5 text-center border border-black w-14">SL NO:</th>
                <th className="px-2 py-1.5 text-center border border-black w-24">Item NO#</th>
                <th className="px-2 py-1.5 text-center border border-black">Description</th>
                <th className="px-2 py-1.5 text-center border border-black w-24">Unit Price</th>
                <th className="px-2 py-1.5 text-center border border-black w-16">Qty</th>
                <th className="px-2 py-1.5 text-center border border-black w-20">Discount</th>
                <th className="px-2 py-1.5 text-center border border-black w-28">Final In SAR</th>
              </tr>
            </thead>
            <tbody className="text-black">
              {formattedItems.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-2 py-1.5 text-center font-bold border border-black">{idx + 1}</td>
                  <td className="px-2 py-1.5 text-center border border-black">{item.sku}</td>
                  <td className="px-2 py-1.5 text-center border border-black uppercase">{item.name}</td>
                  <td className="px-2 py-1.5 text-center font-bold border border-black">{item.price.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-center border border-black">{item.qty}</td>
                  <td className="px-2 py-1.5 text-center font-bold border border-black">{item.discount > 0 ? `${item.discount}%` : '0%'}</td>
                  <td className="px-2 py-1.5 text-center font-bold border border-black">
                    {item.finalInSar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Grand Total Box */}
          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-2 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between font-bold text-base text-slate-900">
                <span>Grand Total</span>
                <span className="text-blue-700">SAR {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="px-6 py-4 border-t bg-slate-50/50">
          <p className="font-bold text-xs mb-2 text-slate-800">Terms & Conditions</p>
          <ul className="text-[10px] text-slate-500 space-y-1 list-disc list-inside">
            {TERMS.map((t, i) => <li key={i}>{t}</li>)}
            <li>Payment Terms: {paymentTermsStr}.</li>
          </ul>
        </div>

        {/* Signatures */}
        <div className="px-6 py-6 border-t">
          <div className="grid grid-cols-3 gap-8 text-center text-xs">
            <div>
              <p className="font-semibold mb-8 text-slate-700">Prepared by</p>
              <div className="border-b border-slate-300 mb-1"></div>
              <p className="font-bold text-slate-800">{salespersonStr}</p>
              <p className="text-slate-400 text-[10px]">Sales Manager</p>
            </div>
            <div>
              <p className="font-semibold mb-8 text-slate-700">Approved by</p>
              <div className="border-b border-slate-300 mb-1"></div>
              <p className="text-slate-400 text-[10px]">Authorized Signature</p>
            </div>
            <div>
              <p className="font-semibold mb-8 text-slate-700">Accepted by</p>
              <div className="border-b border-slate-300 mb-1"></div>
              <p className="text-slate-400 text-[10px]">Customer Signature & Stamp</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 text-white px-6 py-4 text-[10px] flex items-center justify-between">
          <div>
            <p className="font-bold tracking-wide">WALEED MOHAMMED ALSUWAT HOLDING COMPANY</p>
            <p className="text-slate-400">Bldg. 7041, Fayid Al Samaa St., Ext. 3828, Al Ruwais District, Jeddah 23213, KSA</p>
            <p className="text-slate-400">Email: Sales@alsuwatholdings.com • Web: www.alsuwatholdings.com</p>
          </div>
          <div className="text-right text-slate-400">
            <p>CR No: <span className="font-mono text-white">7051488428</span></p>
            <p>VAT No: <span className="font-mono text-white">314190882700003</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InvoiceDownloadPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-slate-600 font-semibold">Loading Official Invoice...</p>
        </div>
      </div>
    }>
      <InvoiceDownloadContent />
    </Suspense>
  )
}
