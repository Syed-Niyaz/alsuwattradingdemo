const fs = require('fs');

let adminPageCode = fs.readFileSync('src/app/(admin)/admin/products/page.tsx', 'utf8');
adminPageCode = adminPageCode.replace(/price_bw: price,/g, 'price_bw: price, price_colored: price * 1.15,');
adminPageCode = adminPageCode.replace(/allColors\.map\(c =>/g, 'allColors.map((c: any) =>');
fs.writeFileSync('src/app/(admin)/admin/products/page.tsx', adminPageCode);
