'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Download,
  MessageCircle,
  Truck,
  ThumbsUp,
  ThumbsDown,
  Printer,
  RefreshCw,
} from 'lucide-react'
import { useQuotations } from '@/context/quotation-context'
import { generateQuotationPDF, shareQuotationViaWhatsApp } from '@/lib/pdf-download'

const TERMS = [
  'We are committed to supplying products as per the approved sample. In case of any quality discrepancy, the company will accept the return of the products without any additional charges.',
  'If the delivered products do not meet the agreed quality standards, the company will replace them accordingly.',
  'Any complaints regarding the product must be registered within 7 Days of delivery.',
  'The company will not entertain any claims made after three (3) days from the date of delivery.',
  'Delivery of products will only be made if previously agreed upon.',
]

const DEFAULT_QUOTATION = {
  id: 'QT-2024-0046',
  date: '18 Dec 2024',
  salesperson: 'Ahmad Al Rashid',
  customer: {
    name: 'syeed',
    contact_person: 'dddd',
    mobile_no: 'ddd',
    email: 'jhhh@gmail.com',
    address: 'dddd',
  },
  items: [
    { name: 'fe', sku: 'fe', price: 25.41, color: 'Standard', qty: 3, discount: 15, amount: 76.24, finalInSar: 76.24 },
  ],
  subtotal: 76.24,
  vat: 11.44,
  grandTotal: 76.24,
  status: 'Quotation Generated',
  paymentTerms: '15 Days',
}

export default function QuotationDocumentPage() {
  const router = useRouter()
  const { updateStatus } = useQuotations()
  const [quotation, setQuotation] = useState<any>(null)
  const [sentViaWhatsApp, setSentViaWhatsApp] = useState(false)
  const [customerResponse, setCustomerResponse] = useState<'accepted' | 'rejected' | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const data = sessionStorage.getItem('quotation_data')
    if (data) {
      try {
        const parsed = JSON.parse(data)
        setQuotation(parsed)
      } catch {
        setQuotation(DEFAULT_QUOTATION)
      }
    } else {
      setQuotation(DEFAULT_QUOTATION)
    }
  }, [])

  if (!quotation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <h2 className="text-xl font-bold">Loading Quotation Document...</h2>
        </div>
      </div>
    )
  }

  // Normalized values
  const custName = typeof quotation.customer === 'string' ? quotation.customer : (quotation.customer?.name || 'syeed')
  const custContact = quotation.customer?.contact_person || quotation.customer?.contact || 'dddd'
  const custPhone = quotation.customer?.mobile_no || quotation.customer?.phone || 'ddd'
  const custEmail = quotation.customer?.email || 'jhhh@gmail.com'
  const custAddress = quotation.customer?.address || 'dddd'

  const rawItems = (quotation.items && quotation.items.length > 0) ? quotation.items : DEFAULT_QUOTATION.items

  const formattedItems = rawItems.map((item: any) => {
    const name = item.product?.name_en || item.name || 'Melamine Product'
    const sku = item.product?.sku || item.sku || 'DP-100'

    const isBW = (item.color || '').toUpperCase() === 'BLACK' || (item.color || '').toUpperCase() === 'WHITE'
    const p_bw = parseFloat(item.product?.price_bw || '0')
    const p_col = parseFloat(item.product?.price_colored || '0')
    const p_gen = parseFloat(item.product?.price || '0')
    const i_price = parseFloat(item.price || '0')
    const basePrice = (isBW ? (p_bw || p_gen) : (p_col || p_bw || p_gen)) || i_price || 25.41

    const color = item.color || 'Standard'
    const qty = parseInt(item.qty, 10) || 1
    const discount = parseFloat(item.discount || '0') || 0
    
    // Calculate final unit price and final line amount
    const finalUnitPrice = basePrice * (1 - discount / 100) * 1.15
    const finalInSar = item.finalInSar ?? item.amount ?? (finalUnitPrice * qty)

    return {
      name,
      sku,
      price: finalUnitPrice,
      color,
      qty,
      discount,
      amount: finalInSar,
      finalInSar,
    }
  })

  const calculatedTotal = formattedItems.reduce((acc: number, i: any) => acc + i.finalInSar, 0)
  const grandTotal = quotation.grandTotal ?? calculatedTotal
  const dateStr = quotation.date || '18 Dec 2024'
  const salespersonStr = quotation.salesperson || 'Ahmad Al Rashid'
  const rawPaymentTerms = quotation.paymentTerms || '15 Days'
  const paymentTermsStr = rawPaymentTerms.replace(/^Net\s+/i, '')

  const handleCreateDeliveryNote = () => {
    sessionStorage.setItem('quotation_data', JSON.stringify({ ...quotation, items: formattedItems }))
    router.push('/quotations/delivery')
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

    const updated = { ...quotation, status: 'Quotation Sent' }
    sessionStorage.setItem('quotation_data', JSON.stringify(updated))

    if (quotation.id) {
      updateStatus(quotation.id, 'Quotation Sent')
    }

    setQuotation(updated)
    setSentViaWhatsApp(true)
  }


  const handleStatusUpdate = (newStatus: string) => {
    const updated = { ...quotation, status: newStatus }
    sessionStorage.setItem('quotation_data', JSON.stringify(updated))
    if (quotation.id) {
      updateStatus(quotation.id, newStatus)
    }
    setQuotation(updated)
  }

  // Exact PDF download - directly downloads the PDF file to disk without opening print dialog
  const handleDownloadExactPDF = () => {
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
    } catch (err) {
      console.error('PDF download error:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleOpenDownloadPage = () => {
    sessionStorage.setItem('quotation_data', JSON.stringify({ ...quotation, items: formattedItems }))
    router.push('/invdownload')
  }


  const hasBeenSent = sentViaWhatsApp || quotation?.status === 'Quotation Sent' || quotation?.status === 'Completed'

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border print:hidden">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="text-slate-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        {customerResponse === null ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => {
                setCustomerResponse('rejected')
                handleStatusUpdate('Customer Rejected')
              }}
            >
              <ThumbsDown className="w-4 h-4 mr-2" /> Mark Rejected
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setCustomerResponse('accepted')
                handleStatusUpdate('Completed')
              }}
            >
              <ThumbsUp className="w-4 h-4 mr-2" /> Mark Accepted
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleOpenDownloadPage}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Page / PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="bg-white">
              <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
            </Button>
            <Button size="sm" onClick={handleSendWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <MessageCircle className="w-4 h-4 mr-2" /> {hasBeenSent ? 'Resend via WhatsApp' : 'Send via WhatsApp'}
            </Button>
          </div>

        )}
      </div>

      {/* Printable Invoice Document (Exact visual layout) */}
      <div className="bg-white shadow-xl rounded-xl mx-auto overflow-hidden border print:shadow-none print:border-none" id="quotation-document">
        {/* Header */}
        <div className="bg-white px-8 pt-6 pb-0">
          <div className="flex items-flex-start gap-5" style={{ alignItems: 'flex-start' }}>
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

            {/* Company text block */}
            <div style={{ paddingTop: 2, paddingLeft: 55 }}>
              <h1
                style={{
                  fontFamily: '"Times New Roman", Georgia, serif',
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#111111',
                  lineHeight: 1.15,
                  margin: 0,
                  letterSpacing: 0,
                }}
              >
                Waleed Mohammed Alsuwat Company Holding
              </h1>
              <p
                style={{
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontSize: 11.5,
                  color: '#1a3a6b',
                  marginTop: 7,
                  lineHeight: 1.6,
                  textAlign: 'center',
                  maxWidth: 460,
                }}
              >
                NJRC Building, 2<sup style={{ fontSize: 9 }}>nd</sup> Floor, Office no 5, Near Al Bassam Tower, Street Al
                {' '}Amir Mohammad <span style={{ textDecoration: 'underline' }}>Bin</span> Saud, P.O Box 7431, Zip Code 32241, Dammam,
                {' '}Eastern Zone, Kingdom of Saudi Arabia.{' '}
                <strong style={{ fontWeight: 700 }}>www.alsuwatlogistics.com</strong>
              </p>
            </div>
          </div>

          {/* Dark maroon horizontal rule */}
          <div
            style={{
              marginTop: 14,
              height: 3,
              background: 'linear-gradient(to right, #6b0000 0%, #8b1a1a 40%, #6b0000 100%)',
              borderRadius: 1,
            }}
          />
          {/* Thin gold accent line */}
          <div style={{ height: 1.5, background: '#c8a97e', marginBottom: 0 }} />
        </div>

        {/* Meta Row */}
        <div className="grid grid-cols-4 border-b text-xs">
          <div className="p-3 border-r bg-slate-50"><span className="font-semibold text-slate-500 block">DATE</span>{dateStr}</div>
          <div className="p-3 border-r bg-slate-50"><span className="font-semibold text-slate-500 block">VALID UNTIL</span>10 Days</div>
          <div className="p-3 border-r bg-slate-50"><span className="font-semibold text-slate-500 block">SALES PERSON</span>{salespersonStr}</div>
          <div className="p-3 bg-slate-50"><span className="font-semibold text-slate-500 block">PAYMENT TERMS</span>{paymentTermsStr}</div>
        </div>

        {/* Bill To */}
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

        {/* Items Table (Renders all products accurately, up to 1,000 items) */}
        <div className="px-6 py-4">
          <table className="w-full text-xs border-collapse border border-black" style={{ fontFamily: '"Times New Roman", Georgia, serif', fontSize: '12.5px' }}>
            <thead>
              <tr className="text-black font-bold" style={{ backgroundColor: '#b4c6e7' }}>
                <th className="px-2 py-1.5 text-center border border-black">SL NO:</th>
                <th className="px-2 py-1.5 text-center border border-black">Item NO#</th>
                <th className="px-2 py-1.5 text-center border border-black">Description</th>
                <th className="px-2 py-1.5 text-center border border-black">Unit Price</th>
                <th className="px-2 py-1.5 text-center border border-black">Qty</th>
                <th className="px-2 py-1.5 text-center border border-black">Discount</th>
                <th className="px-2 py-1.5 text-center border border-black">Final In SAR</th>
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

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-2 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between font-bold text-base text-slate-900">
                <span>Grand Total</span>
                <span className="text-blue-700">SAR {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
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

      {/* Bottom Action Buttons */}
      <div className="max-w-4xl mx-auto mt-8 flex flex-wrap items-center justify-center gap-4 print:hidden">
        <Button
          onClick={handleSendWhatsApp}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {hasBeenSent ? 'Resend via WhatsApp' : 'Send WhatsApp'}
        </Button>

        <Button
          onClick={handleCreateDeliveryNote}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Truck className="w-4 h-4 mr-2" /> Generate Delivery Note
        </Button>

        <Button
          onClick={handleOpenDownloadPage}
          variant="outline"
          className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
        >
          <Download className="w-4 h-4 mr-2 text-blue-600" />
          Download Page / Exact PDF
        </Button>
      </div>
    </div>
  )
}

