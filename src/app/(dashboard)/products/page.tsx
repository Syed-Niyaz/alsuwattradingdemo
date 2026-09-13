import { ProductCatalog } from '@/components/products/catalog'

export default async function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Product Catalog & Cart</h2>
        <p className="text-muted-foreground">Browse all available items, configure variants, and add to your quotation.</p>
      </div>

      <ProductCatalog />
    </div>
  )
}
