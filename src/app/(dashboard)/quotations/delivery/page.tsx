'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Download, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useQuotations } from '@/context/quotation-context'

export default function DeliveryNotePage() {
  const router = useRouter()
  const { updateStatus } = useQuotations()
  const [quotation, setQuotation] = useState<any>(null)
  const [driverName, setDriverName] = useState('')
  const [remarks, setRemarks] = useState('No special remarks.')
  const [sentViaWhatsApp, setSentViaWhatsApp] = useState(false)
  const deliveryNoteId = 'DN-2026-' + Math.floor(1000 + Math.random() * 9000)

  useEffect(() => {
    const data = sessionStorage.getItem('quotation_data')
    if (data) {
      setQuotation(JSON.parse(data))
    }
  }, [])

  const hasBeenSent = sentViaWhatsApp || quotation?.status === 'Quotation Sent' || quotation?.status === 'Completed'

  const handleSendWhatsApp = () => {
    if (!quotation) return

    const custPhone = quotation.customer?.mobile_no || quotation.customer?.phone || quotation.customer?.contact || ''
    const phone = custPhone.replace(/\D/g, '')
    const custName = typeof quotation.customer === 'string' ? quotation.customer : (quotation.customer?.name || 'Customer')
    
    const message = encodeURIComponent(
      `Hello ${custName},\n\nPlease find your Delivery Note *${deliveryNoteId}* (Ref: ${quotation.id}) attached.\n\nThank you for your business!`
    )
    const waUrl = `https://wa.me/${phone}?text=${message}`
    window.open(waUrl, '_blank')

    const updated = { ...quotation, status: 'Quotation Sent' }
    sessionStorage.setItem('quotation_data', JSON.stringify(updated))
    
    if (quotation.id && quotation.status !== 'Completed') {
      updateStatus(quotation.id, 'Quotation Sent')
    }

    setQuotation(updated)
    setSentViaWhatsApp(true)
  }

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
        <span className="text-muted-foreground">Delivery Note</span>
      </div>

      {/* Delivery Note Document */}
      <div className="bg-white shadow-xl rounded-xl max-w-3xl mx-auto overflow-hidden border" id="delivery-note-document">
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
              <h1 className="text-2xl font-bold text-green-700 tracking-wider">DELIVERY NOTE</h1>
              <p className="text-sm text-muted-foreground">{deliveryNoteId}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-800 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-[8px] text-center leading-tight">MELAMINE<br/>GULF FACTORY</span>
            </div>
          </div>
        </div>

        {/* Meta Row */}
        <div className="grid grid-cols-3 border-b text-xs">
          <div className="p-4 border-r bg-slate-50">
            <span className="font-semibold text-slate-500 block uppercase">Date</span>
            <span className="font-medium">{quotation.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="p-4 border-r bg-slate-50">
            <span className="font-semibold text-slate-500 block uppercase">Quotation Ref</span>
            <span className="font-medium">{quotation.id}</span>
          </div>
          <div className="p-4 bg-slate-50">
            <span className="font-semibold text-slate-500 block uppercase">Salesperson</span>
            <span className="font-medium">{quotation.salesperson}</span>
          </div>
        </div>

        {/* Deliver To / Contact Person */}
        <div className="grid grid-cols-2 border-b">
          <div className="p-6 border-r">
            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Deliver To</p>
            <p className="font-bold text-lg">{typeof quotation.customer === 'string' ? quotation.customer : (quotation.customer?.name || 'Customer Name')}</p>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <div>{quotation.customer?.address || ''}</div>
              <div>{quotation.customer?.mobile_no || quotation.customer?.phone || quotation.customer?.contact || ''}</div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Contact Person</p>
            <p className="font-bold">{quotation.customer?.contact_person || quotation.customer?.contact || 'N/A'}</p>
            <div className="text-sm text-muted-foreground">{quotation.customer?.email || ''}</div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-800 text-white text-xs">
                <th className="px-3 py-2.5 text-left">#</th>
                <th className="px-3 py-2.5 text-left">SKU</th>
                <th className="px-3 py-2.5 text-left">PRODUCT NAME</th>
                <th className="px-3 py-2.5 text-right">QUANTITY</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotation.items?.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-sm">{idx + 1}</td>
                  <td className="px-3 py-3 text-sm font-mono text-muted-foreground">{item.product?.sku || item.sku || 'SKU'}</td>
                  <td className="px-3 py-3">
                    <span className="font-medium">{item.product?.name_en || item.name || 'Product Item'}</span>
                    <span className="text-muted-foreground ml-1 text-xs">({item.color || 'Standard'})</span>
                  </td>
                  <td className="px-3 py-3 text-right font-medium">{item.qty || 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Driver Name */}
        <div className="px-6 py-4 border-t">
          <div className="flex items-center gap-4">
            <label className="text-sm font-bold text-green-700 uppercase whitespace-nowrap">Driver Name</label>
            <Input
              placeholder="Enter driver name..."
              value={driverName}
              onChange={e => setDriverName(e.target.value)}
              className="max-w-md"
            />
          </div>
        </div>

        {/* Remarks */}
        <div className="px-6 py-4 border-t">
          <p className="text-sm font-bold text-green-700 uppercase mb-2">Remarks</p>
          <textarea
            className="w-full max-w-md border rounded-lg p-3 text-sm min-h-[60px] bg-white"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
        </div>

        {/* Signatures */}
        <div className="px-6 py-8 border-t">
          <div className="grid grid-cols-3 gap-8 text-center text-xs">
            <div>
              <p className="font-semibold mb-10">Receiver Signature</p>
              <div className="border-b border-slate-300 mb-1"></div>
              <p className="text-muted-foreground">Name & Date</p>
            </div>
            <div>
              <p className="font-semibold mb-10">Driver Signature</p>
              <div className="border-b border-slate-300 mb-1"></div>
              <p className="text-muted-foreground">Name & Date</p>
            </div>
            <div>
              <p className="font-semibold mb-10">Company Signature</p>
              <div className="border-b border-slate-300 mb-1"></div>
              <p className="text-muted-foreground">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 text-white px-6 py-4 text-[10px] flex items-center justify-between">
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

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto no-print">
        <Button variant="outline" onClick={() => router.push('/quotations/document')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quotation
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </Button>
        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSendWhatsApp}>
          <MessageCircle className="w-4 h-4 mr-2" /> {hasBeenSent ? 'Resend via WhatsApp' : 'Send via WhatsApp'}
        </Button>
      </div>
    </div>
  )
}
