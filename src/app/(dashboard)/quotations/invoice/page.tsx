'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, MessageCircle, FileCheck2 } from 'lucide-react'
import Link from 'next/link'

export default function InvoicePage() {
  const router = useRouter()
  const [quotation, setQuotation] = useState<any>(null)
  const invoiceId = 'INV-2026-' + Math.floor(1000 + Math.random() * 9000)

  useEffect(() => {
    const data = sessionStorage.getItem('quotation_data')
    if (data) {
      setQuotation(JSON.parse(data))
    }
  }, [])

  if (!quotation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">No Quotation Data</h2>
          <p className="text-muted-foreground mb-4">Please create a quotation first.</p>
          <Link href="/quotations/new"><Button className="bg-blue-600 hover:bg-blue-700">Create Quotation</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/quotations/document" className="text-blue-600 hover:underline">Quotation Document</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">Invoice</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">🧾 Tax Invoice</h2>
      </div>

      {/* Invoice Document */}
      <div className="bg-white shadow-xl rounded-xl max-w-3xl mx-auto overflow-hidden border print:shadow-none" id="invoice-document">
        {/* Header */}
        <div className="bg-white p-8 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xs text-center leading-tight">ALSUWAT<br/>GROUP</span>
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-800 uppercase">WALEED MOHAMMED ALSUWAT</h2>
                <h2 className="font-bold text-sm text-slate-800 uppercase">HOLDING COMPANY</h2>
                <p className="text-xs text-muted-foreground">Holding Company</p>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-800 tracking-wider">TAX INVOICE</h1>
              <p className="text-sm text-muted-foreground">{invoiceId}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-800 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-[8px] text-center leading-tight">MELAMINE<br/>GULF FACTORY</span>
            </div>
          </div>
        </div>

        {/* Meta Row */}
        <div className="grid grid-cols-4 border-b text-xs">
          <div className="p-3 border-r bg-slate-50"><span className="font-semibold text-slate-500 block">INVOICE DATE</span>{quotation.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div className="p-3 border-r bg-slate-50"><span className="font-semibold text-slate-500 block">QUOTATION REF</span>{quotation.id}</div>
          <div className="p-3 border-r bg-slate-50"><span className="font-semibold text-slate-500 block">SALES PERSON</span>{quotation.salesperson}</div>
          <div className="p-3 bg-slate-50"><span className="font-semibold text-slate-500 block">PAYMENT TERMS</span>Net 15 Days</div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 border-b">
          <div className="p-6 border-r">
            <p className="text-xs font-semibold text-red-600 uppercase mb-2">BILL TO:</p>
            <p className="font-bold text-lg">{quotation.customer?.name}</p>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <div>{quotation.customer?.contact_person}</div>
              <div>{quotation.customer?.address}</div>
              <div>Tel: {quotation.customer?.mobile_no}</div>
              <div>Email: {quotation.customer?.email}</div>
            </div>
          </div>
          <div className="p-6">
             <p className="text-xs font-semibold text-blue-700 uppercase mb-2">CUSTOMER DETAILS:</p>
             <div className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">VAT No:</span><span className="font-medium font-mono">{quotation.customer?.vat || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CR No:</span><span className="font-medium font-mono">{quotation.customer?.cr || 'N/A'}</span></div>
             </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-6 py-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-3 py-2 text-left">PRODUCT DESCRIPTION</th>
                <th className="px-3 py-2 text-center">QUANTITY</th>
                <th className="px-3 py-2 text-center">UNIT PRICE</th>
                <th className="px-3 py-2 text-center">DISCOUNT</th>
                <th className="px-3 py-2 text-right">NET AMOUNT</th>
                <th className="px-3 py-2 text-right">VAT (15%)</th>
                <th className="px-3 py-2 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotation.items.map((item: any, idx: number) => {
                 const amount = ((item.color || "").toUpperCase() === "BLACK" || (item.color || "").toUpperCase() === "WHITE" ? (item.product.price_bw ?? 0) : (item.product.price_colored ?? item.product.price_bw ?? 0)) * item.qty * (1 - item.discount / 100);
                 const itemVat = amount * 0.15;
                 const itemTotal = amount + itemVat;
                 return (
                  <tr key={idx}>
                    <td className="px-3 py-3">
                      <div className="font-semibold">{item.product.name_en} • {item.color}</div>
                      <div className="text-muted-foreground">{item.product.sku}</div>
                    </td>
                    <td className="px-3 py-3 text-center">{item.qty}</td>
                    <td className="px-3 py-3 text-center">SAR {((item.color || "").toUpperCase() === "BLACK" || (item.color || "").toUpperCase() === "WHITE" ? (item.product.price_bw ?? 0) : (item.product.price_colored ?? item.product.price_bw ?? 0)).toFixed(2)}</td>
                    <td className="px-3 py-3 text-center">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                    <td className="px-3 py-3 text-right font-medium">SAR {amount.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right font-medium text-slate-500">SAR {itemVat.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right font-bold text-blue-700">SAR {itemTotal.toFixed(2)}</td>
                  </tr>
                 )
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mt-4">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between"><span>Total Amount (excl. VAT)</span><span>SAR {quotation.netAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span className="text-red-500">-SAR {quotation.totalDiscount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Total VAT (15%)</span><span>SAR {quotation.vat.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg pt-1 border-t text-blue-800"><span>Grand Total</span><span>SAR {quotation.grandTotal.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 text-white px-6 py-4 text-[10px] flex items-center justify-between mt-12">
          <div>
            <p className="font-bold">WALEED MOHAMMED ALSUWAT HOLDING COMPANY</p>
            <p>Bldg. 7041, Fayid Al Samaa St., Ext. 3828, Al Ruwais District, Jeddah 23213, KSA</p>
            <p>Email: Sales@alsuwatholdings.com • Web: www.alsuwatholdings.com</p>
          </div>
          <div className="text-right">
            <p>CR No: <span className="font-mono">7051488428</span></p>
            <p>VAT No: <span className="font-mono">314190882700003</span></p>
          </div>
        </div>
      </div>

      {/* Document Actions */}
      <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/quotations/document')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quotation
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </Button>
        <Button className="bg-green-600 hover:bg-green-700">
          <MessageCircle className="w-4 h-4 mr-2" /> Send Invoice via WhatsApp
        </Button>
      </div>
    </div>
  )
}
