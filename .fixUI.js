const fs = require('fs');

// --- 1. Fix src/app/(admin)/admin/products/page.tsx ---
let adminPageCode = fs.readFileSync('src/app/(admin)/admin/products/page.tsx', 'utf8');

// Replace Add Product Price Inputs
adminPageCode = adminPageCode.replace(
  /<label className="text-sm font-bold text-slate-700 dark:text-slate-300">Default Price \(SAR\) \*(.*?)<Input id="add-price"/s,
  `<label className="text-sm font-bold text-slate-700 dark:text-slate-300">Black/White Price (SAR) *</label>
                  <Input id="add-price-bw" type="number" placeholder="0.00" className="bg-white dark:bg-slate-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Other Colors Price (SAR) *</label>
                  <Input id="add-price-colored"`
);

// Replace Add Product onClick logic
adminPageCode = adminPageCode.replace(
  /const price = parseFloat\(\(document\.getElementById\('add-price'\) as HTMLInputElement\)\?\.value \|\| '0'\);/,
  `const price = parseFloat((document.getElementById('add-price-bw') as HTMLInputElement)?.value || '0');
                const priceColored = parseFloat((document.getElementById('add-price-colored') as HTMLInputElement)?.value || String(price * 1.15));`
);
adminPageCode = adminPageCode.replace(
  /price_bw: price, price_colored: price \* 1.15,/,
  `price_bw: price, price_colored: priceColored,`
);

// Replace Edit Product Price Inputs
adminPageCode = adminPageCode.replace(
  /<label className="text-sm font-bold text-slate-700 dark:text-slate-300">Default Price \(SAR\) \*(.*?)<Input type="number" defaultValue={editProduct.price}/s,
  `<label className="text-sm font-bold text-slate-700 dark:text-slate-300">Black/White Price (SAR) *</label>
                  <Input id="edit-price-bw" type="number" defaultValue={editProduct.price_bw ?? editProduct.price} className="bg-white dark:bg-slate-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Other Colors Price (SAR) *</label>
                  <Input id="edit-price-colored" type="number" defaultValue={editProduct.price_colored ?? (editProduct.price_bw ?? editProduct.price) * 1.15} className="bg-white dark:bg-slate-800" />`
);

// Replace Edit Product onClick logic (saving)
adminPageCode = adminPageCode.replace(
  /const newQty = parseInt\(qtyInput\.value\) \|\| 0/,
  `const newQty = parseInt(qtyInput.value) || 0;
                  const priceBwInput = document.getElementById('edit-price-bw') as HTMLInputElement;
                  const priceColoredInput = document.getElementById('edit-price-colored') as HTMLInputElement;
                  const newPriceBw = priceBwInput ? parseFloat(priceBwInput.value) : editProduct.price_bw;
                  const newPriceColored = priceColoredInput ? parseFloat(priceColoredInput.value) : editProduct.price_colored;`
);
adminPageCode = adminPageCode.replace(
  /variants: p\.variants\.map\(v => v\.color === editProduct\.variantColor \? \{ \.\.\.v, stock: newQty \} : v\)/,
  `variants: p.variants.map(v => v.color === editProduct.variantColor ? { ...v, stock: newQty } : v),
                        price_bw: newPriceBw,
                        price_colored: newPriceColored`
);

fs.writeFileSync('src/app/(admin)/admin/products/page.tsx', adminPageCode);


// --- 2. Fix src/app/(admin)/admin/products/[id]/page.tsx ---
// Since we don't have a direct "edit base product" modal here (just the variant modal that shows price but doesn't let you edit it, wait it does... let's check).
// If there's an edit price input in [id]/page.tsx, let's fix it.
// I saw "variant-price" input when I did findstr!
// It was around line 313 in the ADD VARIANT MODAL in page.tsx! Oh wait, `src/app/(admin)/admin/products/page.tsx` has `addVariantProduct?.price`.
// Wait, my `findstr` was ONLY on `src/app/(admin)/admin/products/page.tsx`, so the `variant-price` is in `page.tsx`, NOT `[id]/page.tsx`.
// Wait, let's fix the ADD VARIANT modal price input in `src/app/(admin)/admin/products/page.tsx`.

// Replace Add Variant Price Inputs
adminPageCode = fs.readFileSync('src/app/(admin)/admin/products/page.tsx', 'utf8');
adminPageCode = adminPageCode.replace(
  /<label className="text-sm font-bold text-slate-700 dark:text-slate-300">Update Price \(Optional\)(.*?)<Input id="variant-price" type="number" placeholder={String\(addVariantProduct\?\.price \|\| ''\)}/s,
  `<label className="text-sm font-bold text-slate-700 dark:text-slate-300">Update B/W Price</label>
                  <Input id="variant-price-bw" type="number" placeholder={String(addVariantProduct?.price_bw || addVariantProduct?.price || '')} className="bg-white dark:bg-slate-800" />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Update Colored Price</label>
                  <Input id="variant-price-colored" type="number" placeholder={String(addVariantProduct?.price_colored || (addVariantProduct?.price_bw || 0) * 1.15 || '')}`
);

adminPageCode = adminPageCode.replace(
  /const priceVal = \(document\.getElementById\('variant-price'\) as HTMLInputElement\)\?\.value;/,
  `const priceBwVal = (document.getElementById('variant-price-bw') as HTMLInputElement)?.value;
                const priceColoredVal = (document.getElementById('variant-price-colored') as HTMLInputElement)?.value;`
);

adminPageCode = adminPageCode.replace(
  /price_bw: priceVal \? parseFloat\(priceVal\) : \(p\.price_bw \?\? \(p as any\)\.price \?\? 0\),/,
  `price_bw: priceBwVal ? parseFloat(priceBwVal) : (p.price_bw ?? (p as any).price ?? 0),
                      price_colored: priceColoredVal ? parseFloat(priceColoredVal) : (p.price_colored ?? p.price_bw * 1.15 ?? 0),`
);

fs.writeFileSync('src/app/(admin)/admin/products/page.tsx', adminPageCode);

console.log('Fixed UI to allow Black/White vs Colored Prices');
