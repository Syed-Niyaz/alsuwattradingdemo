import { ProductCatalog } from '@/components/products/catalog'

export default async function AdminCatalogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Product Catalog (Admin View)</h2>
        <p className="text-muted-foreground">View the product catalog exactly as it appears to salespersons.</p>
      </div>

      <ProductCatalog />
    </div>
  )
}
