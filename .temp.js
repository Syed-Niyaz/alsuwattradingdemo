const fs = require('fs');

let catalogCode = fs.readFileSync('src/components/products/catalog.tsx', 'utf8');
catalogCode = catalogCode.replace(/SAR \{p\.price\.toFixed\(2\)\}/g, 'SAR {((selectedColors[p.id] || p.variants[0].color).toUpperCase() === "BLACK" || (selectedColors[p.id] || p.variants[0].color).toUpperCase() === "WHITE" ? p.price_bw : p.price_colored).toFixed(2)}');
fs.writeFileSync('src/components/products/catalog.tsx', catalogCode);

let adminPageCode = fs.readFileSync('src/app/(admin)/admin/products/page.tsx', 'utf8');
adminPageCode = adminPageCode.replace(/p\.price/g, 'p.price_bw');
adminPageCode = adminPageCode.replace(/price: e\.target\.value/g, 'price_bw: Number(e.target.value), price_colored: Number(e.target.value) * 1.15');
adminPageCode = adminPageCode.replace(/price:/g, 'price_bw:');
fs.writeFileSync('src/app/(admin)/admin/products/page.tsx', adminPageCode);

let adminIdPageCode = fs.readFileSync('src/app/(admin)/admin/products/[id]/page.tsx', 'utf8');
adminIdPageCode = adminIdPageCode.replace(/product\.price/g, 'product.price_bw');
adminIdPageCode = adminIdPageCode.replace(/price:/g, 'price_bw:');
fs.writeFileSync('src/app/(admin)/admin/products/[id]/page.tsx', adminIdPageCode);

let quoteNewCode = fs.readFileSync('src/app/(dashboard)/quotations/new/page.tsx', 'utf8');
quoteNewCode = quoteNewCode.replace(/price: ([\d.]+)/g, (match, p1) => {
  const num = parseFloat(p1);
  return 'price_bw: ' + num + ', price_colored: ' + (num * 1.15).toFixed(2);
});
quoteNewCode = quoteNewCode.replace(/item\.product\.price/g, '((item.color || "").toUpperCase() === "BLACK" || (item.color || "").toUpperCase() === "WHITE" ? item.product.price_bw : item.product.price_colored)');
fs.writeFileSync('src/app/(dashboard)/quotations/new/page.tsx', quoteNewCode);

let previewCode = fs.readFileSync('src/app/(dashboard)/quotations/preview/page.tsx', 'utf8');
previewCode = previewCode.replace(/item\.product\.price/g, '((item.color || "").toUpperCase() === "BLACK" || (item.color || "").toUpperCase() === "WHITE" ? item.product.price_bw : item.product.price_colored)');
fs.writeFileSync('src/app/(dashboard)/quotations/preview/page.tsx', previewCode);

let invoiceCode = fs.readFileSync('src/app/(dashboard)/quotations/invoice/page.tsx', 'utf8');
invoiceCode = invoiceCode.replace(/item\.product\.price/g, '((item.color || "").toUpperCase() === "BLACK" || (item.color || "").toUpperCase() === "WHITE" ? item.product.price_bw : item.product.price_colored)');
fs.writeFileSync('src/app/(dashboard)/quotations/invoice/page.tsx', invoiceCode);

let documentCode = fs.readFileSync('src/app/(dashboard)/quotations/document/page.tsx', 'utf8');
documentCode = documentCode.replace(/item\.product\?\.price/g, '(item.product ? ((item.color || "").toUpperCase() === "BLACK" || (item.color || "").toUpperCase() === "WHITE" ? item.product.price_bw : item.product.price_colored) : undefined)');
fs.writeFileSync('src/app/(dashboard)/quotations/document/page.tsx', documentCode);

console.log('Update complete.');
