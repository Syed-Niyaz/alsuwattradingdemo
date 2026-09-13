import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface QuotationPDFData {
  id: string
  date: string
  salesperson: string
  paymentTerms: string
  customer: {
    name: string
    contact_person?: string
    mobile_no?: string
    email?: string
    address?: string
  }
  items: Array<{
    name: string
    sku: string
    price: number
    qty: number
    discount: number
    finalInSar: number
  }>
  subtotal: number
  vat: number
  grandTotal: number
}

const TERMS = [
  '1. We are committed to supplying products as per the approved sample. In case of any quality discrepancy, the company will accept the return of the products without any additional charges.',
  '2. If the delivered products do not meet the agreed quality standards, the company will replace them accordingly.',
  '3. Any complaints regarding the product must be registered within 7 Days of delivery.',
  '4. The company will not entertain any claims made after three (3) days from the date of delivery.',
  '5. Delivery of products will only be made if previously agreed upon.',
]

/**
 * Builds the complete jsPDF document with official Alsuwat Group logo, header, table, and footer.
 */
export function createQuotationPDFDoc(data: QuotationPDFData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14

  // --- Official Alsuwat Group Logo Box ---
  const logoX = margin
  const logoY = 10
  const logoW = 24
  const logoH = 22

  doc.setFillColor(245, 247, 250)
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.roundedRect(logoX, logoY, logoW, logoH, 1, 1, 'FD')

  // Triangle Icons
  doc.setFillColor(26, 58, 107) // #1a3a6b
  doc.triangle(logoX + 12, logoY + 3, logoX + 20, logoY + 13, logoX + 4, logoY + 13, 'F')
  doc.setFillColor(37, 99, 168) // #2563a8 inner
  doc.triangle(logoX + 12, logoY + 5.5, logoX + 17, logoY + 12, logoX + 7, logoY + 12, 'F')

  doc.setFontSize(4)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 58, 107)
  doc.text('مجموعة السواط', logoX + 12, logoY + 16.5, { align: 'center' })
  doc.setFontSize(3.8)
  doc.text('ALSUWAT GROUP', logoX + 12, logoY + 19.5, { align: 'center' })

  // --- Company Title block on right of logo ---
  const textLeft = logoX + logoW + 4
  const textWidth = pageWidth - margin - textLeft

  doc.setFont('times', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(17, 17, 17)
  doc.text('Waleed Mohammed Alsuwat Company Holding', textLeft + textWidth / 2, 14.5, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(26, 58, 107)
  const addressText = 'NJRC Building, 2nd Floor, Office no 5, Near Al Bassam Tower, Street Al Amir Mohammad Bin Saud, P.O Box 7431, Zip Code 32241, Dammam, Eastern Zone, Kingdom of Saudi Arabia. www.alsuwatlogistics.com'
  const splitAddress = doc.splitTextToSize(addressText, textWidth - 6)
  doc.text(splitAddress, textLeft + textWidth / 2, 19.5, { align: 'center' })

  // Maroon separator line
  doc.setDrawColor(107, 0, 0)
  doc.setLineWidth(0.8)
  doc.line(margin, 34, pageWidth - margin, 34)

  // Gold line
  doc.setDrawColor(200, 169, 126)
  doc.setLineWidth(0.4)
  doc.line(margin, 35.2, pageWidth - margin, 35.2)

  // Meta Table
  const metaY = 37.5
  doc.setFillColor(248, 250, 252)
  doc.rect(margin, metaY, pageWidth - margin * 2, 11, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.2)
  doc.rect(margin, metaY, pageWidth - margin * 2, 11, 'S')

  const colWidth = (pageWidth - margin * 2) / 4
  doc.line(margin + colWidth, metaY, margin + colWidth, metaY + 11)
  doc.line(margin + colWidth * 2, metaY, margin + colWidth * 2, metaY + 11)
  doc.line(margin + colWidth * 3, metaY, margin + colWidth * 3, metaY + 11)

  doc.setFontSize(6.5)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'bold')
  doc.text('DATE', margin + 3, metaY + 3.8)
  doc.text('VALID UNTIL', margin + colWidth + 3, metaY + 3.8)
  doc.text('SALES PERSON', margin + colWidth * 2 + 3, metaY + 3.8)
  doc.text('PAYMENT TERMS', margin + colWidth * 3 + 3, metaY + 3.8)

  doc.setFontSize(7.5)
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'normal')
  doc.text(data.date || '18 Dec 2024', margin + 3, metaY + 8.2)
  doc.text('10 Days', margin + colWidth + 3, metaY + 8.2)
  doc.text(data.salesperson || 'Ahmad Al Rashid', margin + colWidth * 2 + 3, metaY + 8.2)
  doc.text(data.paymentTerms || '30 Days', margin + colWidth * 3 + 3, metaY + 8.2)

  // BILL TO Box
  const billToY = 52
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(220, 38, 38)
  doc.text('BILL TO:', margin, billToY)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(data.customer.name || 'Customer Name', margin, billToY + 4.5)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  const contactInfo = [
    `Contact: ${data.customer.contact_person || data.customer.name || 'N/A'}`,
    `Address: ${data.customer.address || 'N/A'}`,
    `Tel: ${data.customer.mobile_no || 'N/A'}`,
    `Email: ${data.customer.email || 'N/A'}`,
  ]
  contactInfo.forEach((line, idx) => {
    doc.text(line, margin, billToY + 8.5 + idx * 3.5)
  })

  // Prepare table rows
  const tableRows = data.items.map((item, idx) => [
    (idx + 1).toString(),
    item.sku || `SKU-${idx + 1}`,
    item.name.toUpperCase(),
    item.price.toFixed(2),
    item.qty.toString(),
    item.discount > 0 ? `${item.discount}%` : '0%',
    item.finalInSar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  ])

  const tableStartY = billToY + 24

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin, bottom: 20 },
    head: [['SL NO:', 'Item NO#', 'Description', 'Unit Price', 'Qty', 'Discount', 'Final In SAR']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [180, 198, 231], // #b4c6e7
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7.5,
      lineWidth: 0.15,
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      fontSize: 7,
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'left', cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      6: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
    },
    didDrawPage: (hookData) => {
      const current = hookData.pageNumber
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text(`Quotation ${data.id || ''} — Page ${current}`, pageWidth - margin, pageHeight - 6, { align: 'right' })
    },
  })

  let currentY = (doc as any).lastAutoTable.finalY + 5
  if (currentY + 60 > pageHeight - 14) {
    doc.addPage()
    currentY = 16
  }

  // Grand Total Box
  const totalBoxWidth = 65
  const totalBoxX = pageWidth - margin - totalBoxWidth
  doc.setFillColor(248, 250, 252)
  doc.rect(totalBoxX, currentY, totalBoxWidth, 13, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.2)
  doc.rect(totalBoxX, currentY, totalBoxWidth, 13, 'S')

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Grand Total:', totalBoxX + 4, currentY + 8)

  doc.setFontSize(9.5)
  doc.setTextColor(26, 58, 107)
  doc.text(`SAR ${data.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalBoxX + totalBoxWidth - 4, currentY + 8, { align: 'right' })

  currentY += 18

  // Terms & Conditions
  if (currentY + 40 > pageHeight - 14) {
    doc.addPage()
    currentY = 16
  }

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Terms & Conditions', margin, currentY)
  currentY += 3.5

  doc.setFontSize(6.2)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  TERMS.forEach((term) => {
    doc.text(term, margin, currentY)
    currentY += 3.2
  })
  doc.text(`• Payment Terms: ${data.paymentTerms || '30 Days'}.`, margin, currentY)
  currentY += 7

  // Signatures
  if (currentY + 28 > pageHeight - 14) {
    doc.addPage()
    currentY = 16
  }

  const sigColWidth = (pageWidth - margin * 2) / 3
  const sigLabels = [
    { title: 'Prepared by', name: data.salesperson || 'Ahmad Al Rashid', role: 'Sales Manager' },
    { title: 'Approved by', name: '', role: 'Authorized Signature' },
    { title: 'Accepted by', name: '', role: 'Customer Signature & Stamp' },
  ]

  sigLabels.forEach((sig, idx) => {
    const x = margin + idx * sigColWidth + sigColWidth / 2
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(51, 65, 85)
    doc.text(sig.title, x, currentY, { align: 'center' })

    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(x - 20, currentY + 10, x + 20, currentY + 10)

    if (sig.name) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text(sig.name, x, currentY + 14, { align: 'center' })
    }

    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text(sig.role, x, currentY + (sig.name ? 17.5 : 14), { align: 'center' })
  })

  // Official Dark Footer
  const footerY = pageHeight - 12
  doc.setFillColor(15, 23, 42)
  doc.rect(margin, footerY, pageWidth - margin * 2, 9, 'F')

  doc.setFontSize(5.8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('WALEED MOHAMMED ALSUWAT HOLDING COMPANY', margin + 3, footerY + 3.2)

  doc.setFontSize(5.2)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225)
  doc.text('Bldg. 7041, Fayid Al Samaa St., Ext. 3828, Al Ruwais District, Jeddah 23213, KSA  •  Sales@alsuwatholdings.com', margin + 3, footerY + 6.8)

  doc.text('CR No: 7051488428  |  VAT No: 314190882700003', pageWidth - margin - 3, footerY + 5, { align: 'right' })

  return doc
}

/**
 * Directly downloads the PDF file to the user's browser.
 */
export function generateQuotationPDF(data: QuotationPDFData) {
  const doc = createQuotationPDFDoc(data)
  const fileName = `Invoice_${data.id || 'QT-2024'}_${data.customer.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  doc.save(fileName)
}

/**
 * Returns PDF Blob for sharing or uploading
 */
export function getQuotationPDFBlob(data: QuotationPDFData): Blob {
  const doc = createQuotationPDFDoc(data)
  return doc.output('blob')
}

/**
 * Shares quotation via WhatsApp.
 * - On supported devices (Mobile/Tablets/Windows Share), attaches the REAL PDF file directly via Web Share API.
 * - On desktop browsers (where browser security prohibits direct file injection into third-party web apps),
 *   it downloads the PDF invoice file immediately and opens WhatsApp with the complete itemized invoice breakdown.
 */
export async function shareQuotationViaWhatsApp(data: QuotationPDFData, phone?: string) {
  const rawPhone = phone ? phone.replace(/\D/g, '') : ''
  const cleanPhone = rawPhone.length >= 7
    ? (rawPhone.startsWith('0') ? `966${rawPhone.slice(1)}` : (rawPhone.startsWith('966') ? rawPhone : `966${rawPhone}`))
    : ''
    
  const invoiceLink = typeof window !== 'undefined' ? `${window.location.origin}/invdownload` : ''
  
  // Format each line item for WhatsApp
  const itemLines = data.items.map((item, idx) => {
    const discountStr = item.discount > 0 ? ` (${item.discount}% off)` : ''
    return `${idx + 1}. *${item.name}* (Item#: ${item.sku})\n   ${item.qty} pcs × SAR ${item.price.toFixed(2)}${discountStr} = *SAR ${item.finalInSar.toFixed(2)}*`
  })

  const displayedItemLines = itemLines.length > 20
    ? [...itemLines.slice(0, 15), `... and ${itemLines.length - 15} more items (see attached PDF)`]
    : itemLines

  const messageLines = [
    `*📋 OFFICIAL INVOICE COPY: ${data.id || 'QT-2024'}*`,
    `🏢 *Waleed Mohammed Alsuwat Company Holding*`,
    `👤 *Customer:* ${data.customer.name}`,
    `📅 *Date:* ${data.date}`,
    `💳 *Payment Terms:* ${data.paymentTerms}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*📦 INVOICE ITEMS (${data.items.length} Products):*`,
    ``,
    displayedItemLines.join('\n\n'),
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*Subtotal:* SAR ${data.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `*VAT (15%):* SAR ${data.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `💰 *GRAND TOTAL:* *SAR ${data.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📥 *Download Official Signed PDF Invoice:*`,
    `${invoiceLink}`,
    ``,
    `*Terms & Conditions:*`,
    `• Supplied as per approved sample.`,
    `• Payment Terms: ${data.paymentTerms}.`,
    ``,
    `Thank you for choosing Alsuwat Group!`,
  ]

  const message = messageLines.join('\n')

  // Generate real PDF File
  const pdfBlob = getQuotationPDFBlob(data)
  const filename = `Invoice_${data.id || 'QT-2024'}_${data.customer.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' })

  // 1. If device supports direct file sharing (Mobile phones, tablets, native share targets), share the real PDF file directly!
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Invoice ${data.id}`,
        text: message,
      })
      return
    } catch (err: any) {
      if (err.name === 'AbortError') return
    }
  }

  // 2. Desktop Web: Download the PDF file directly + open WhatsApp Web
  const encodedMsg = encodeURIComponent(message)
  const waUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
    : `https://api.whatsapp.com/send?text=${encodedMsg}`

  if (typeof window !== 'undefined') {
    window.open(waUrl, '_blank')
  }

  // Trigger download of the PDF file to user's downloads tray
  try {
    generateQuotationPDF(data)
  } catch (err) {
    console.error('PDF auto-download error:', err)
  }
}
