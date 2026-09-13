'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ProductVariant = {
  id?: string
  color: string
  stock: number
  sales?: number
}

export type Product = {
  id: string
  name_en: string
  name_ar: string
  sku: string
  category: string
  price_bw: number
  price_colored: number
  image_color: string
  base_image_url: string
  image_url: string
  expected?: string
  variants: ProductVariant[]
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name_en: 'Cup & Saucer Set',
    name_ar: 'فنجان وصحن',
    sku: 'CS-150',
    category: 'Accessories',
    price_bw: 14,
    price_colored: 16.10,
    image_color: 'bg-stone-100',
    base_image_url: '/images/cup_saucer',
    image_url: '/images/cup_saucer.png',
    variants: [
      { color: 'WHITE', stock: 45, sales: 120 },
      { color: 'BLACK', stock: 12, sales: 50 },
      { color: 'GOLDEN MARBLA', stock: 8, sales: 15 },
      { color: 'WHITE MARBLE', stock: 24, sales: 42 },
      { color: 'CREAM DOT', stock: 30, sales: 85 },
      { color: 'BLACK MARBLE', stock: 5, sales: 10 },
      { color: 'GRAY 1200', stock: 15, sales: 25 },
    ]
  },
  {
    id: '2',
    name_en: 'Deep Plate 9"',
    name_ar: 'طبق عميق 9 بوصة',
    sku: 'DP-090',
    category: 'Dinner Plates',
    price_bw: 10,
    price_colored: 11.50,
    image_color: 'bg-[#F2EDE4]',
    base_image_url: '/images/plate_white',
    image_url: '/images/plate_white.png',
    variants: [
      { color: 'WHITE', stock: 50, sales: 210 },
      { color: 'BLACK', stock: 5, sales: 80 },
      { color: 'GOLDEN MARBLA', stock: 12, sales: 30 },
      { color: 'WHITE MARBLE', stock: 18, sales: 65 },
      { color: 'CREAM DOT', stock: 40, sales: 150 },
      { color: 'BLACK MARBLE', stock: 2, sales: 15 },
      { color: 'GRAY 1200', stock: 11, sales: 40 },
    ]
  },
  {
    id: '3',
    name_en: 'Dinner Plate 11"',
    name_ar: 'طبق عشاء 11 بوصة',
    sku: 'DP-110',
    category: 'Dinner Plates',
    price_bw: 12.5,
    price_colored: 14.37,
    image_color: 'bg-zinc-800',
    base_image_url: '/images/plate_black',
    image_url: '/images/plate_black.png',
    variants: [
      { color: 'WHITE', stock: 10, sales: 180 },
      { color: 'BLACK', stock: 20, sales: 120 },
      { color: 'GOLDEN MARBLA', stock: 35, sales: 45 },
      { color: 'WHITE MARBLE', stock: 8, sales: 70 },
      { color: 'CREAM DOT', stock: 22, sales: 110 },
      { color: 'BLACK MARBLE', stock: 14, sales: 20 },
      { color: 'GRAY 1200', stock: 50, sales: 55 },
    ]
  },
  {
    id: '4',
    name_en: 'Dinner Set Black',
    name_ar: 'طقم عشاء',
    sku: 'DNS-510',
    category: 'Accessories',
    price_bw: 95,
    price_colored: 109.25,
    image_color: 'bg-zinc-900',
    base_image_url: '/images/dinner_set_black',
    image_url: '/images/dinner_set_black.png',
    variants: [
      { color: 'WHITE', stock: 0, sales: 45 },
      { color: 'BLACK', stock: 18, sales: 85 },
      { color: 'GOLDEN MARBLA', stock: 2, sales: 10 },
      { color: 'WHITE MARBLE', stock: 5, sales: 25 },
      { color: 'CREAM DOT', stock: 12, sales: 30 },
      { color: 'BLACK MARBLE', stock: 8, sales: 15 },
      { color: 'GRAY 1200', stock: 20, sales: 40 },
    ]
  },
  {
    id: '5',
    name_en: 'Leaf Platter 12"',
    name_ar: 'طبق ورقة 12 بوصة',
    sku: 'LP-360',
    category: 'Platters',
    price_bw: 32,
    price_colored: 36.80,
    expected: '20 Aug 2026',
    image_color: 'bg-green-50',
    base_image_url: '/images/serving_platter',
    image_url: '/images/serving_platter.png',
    variants: [
      { color: 'WHITE', stock: 5, sales: 65 },
      { color: 'BLACK', stock: 0, sales: 30 },
      { color: 'GOLDEN MARBLA', stock: 2, sales: 5 },
      { color: 'WHITE MARBLE', stock: 1, sales: 15 },
      { color: 'CREAM DOT', stock: 8, sales: 40 },
      { color: 'BLACK MARBLE', stock: 0, sales: 8 },
      { color: 'GRAY 1200', stock: 4, sales: 12 },
    ]
  },
  {
    id: '6',
    name_en: 'Soup Bowl',
    name_ar: 'طبق شوربة',
    sku: 'SB-200',
    category: 'Bowls',
    price_bw: 8.5,
    price_colored: 9.77,
    image_color: 'bg-amber-50',
    base_image_url: '/images/soup_bowl',
    image_url: '/images/soup_bowl.png',
    variants: [
      { color: 'WHITE', stock: 60, sales: 250 },
      { color: 'BLACK', stock: 45, sales: 110 },
      { color: 'GOLDEN MARBLA', stock: 20, sales: 40 },
      { color: 'WHITE MARBLE', stock: 35, sales: 85 },
      { color: 'CREAM DOT', stock: 55, sales: 190 },
      { color: 'BLACK MARBLE', stock: 12, sales: 25 },
      { color: 'GRAY 1200', stock: 30, sales: 60 },
    ]
  }
]

type ProductContextType = {
  products: Product[]
  deductStock: (productId: string, color: string, qty: number) => Promise<void>
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  refreshProducts: () => Promise<void>
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchProductsFromSupabase = async () => {
    const supabase = createClient()
    if (!supabase) return

    try {
      const { data: dbProducts, error } = await supabase
        .from('products')
        .select(`
          id,
          item_no,
          description,
          arabic_description,
          category,
          unit_price,
          product_variants (
            id,
            color,
            stock_quantity
          )
        `)

      if (dbProducts && !error && dbProducts.length > 0) {
        const formatted: Product[] = dbProducts.map((p: any) => {
          const initMatch = INITIAL_PRODUCTS.find(ip => ip.sku === p.item_no || ip.name_en === p.description)
          return {
            id: p.id,
            sku: p.item_no,
            name_en: p.description,
            name_ar: p.arabic_description || p.description,
            category: p.category || 'General',
            price_bw: Number(p.unit_price) || 10,
            price_colored: Number((Number(p.unit_price) * 1.15).toFixed(2)),
            image_color: initMatch?.image_color || 'bg-slate-100',
            base_image_url: initMatch?.base_image_url || '/images/cup_saucer',
            image_url: initMatch?.image_url || '/images/cup_saucer.png',
            variants: p.product_variants && p.product_variants.length > 0
              ? p.product_variants.map((v: any) => ({
                  id: v.id,
                  color: v.color,
                  stock: v.stock_quantity,
                  sales: 25,
                }))
              : (initMatch?.variants || [
                  { color: 'WHITE', stock: 50, sales: 20 },
                  { color: 'BLACK', stock: 30, sales: 15 },
                ])
          }
        })
        setProducts(formatted)
        localStorage.setItem('global_products_v2', JSON.stringify(formatted))
      }
    } catch (err) {
      console.error('Error fetching products from Supabase:', err)
    }
  }

  useEffect(() => {
    // Initial local cache load for instantaneous UI rendering
    const saved = localStorage.getItem('global_products_v2') || localStorage.getItem('global_products_v1')
    if (saved) {
      try {
        setProducts(JSON.parse(saved))
      } catch {
        setProducts(INITIAL_PRODUCTS)
      }
    }
    setIsLoaded(true)

    // Live Supabase fetch
    fetchProductsFromSupabase()

    // Realtime Supabase Listener for inventory and stock changes
    const supabase = createClient()
    if (!supabase) return

    const channel = supabase
      .channel('realtime_products_stock')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_variants' },
        (_payload: any) => {
          fetchProductsFromSupabase()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (_payload: any) => {
          fetchProductsFromSupabase()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const deductStock = async (productId: string, color: string, qty: number) => {
    setProducts(prevProducts => 
      prevProducts.map(p => {
        if (p.id !== productId) return p
        return {
          ...p,
          variants: p.variants.map(v => {
            if (v.color !== color) return v
            return {
              ...v,
              stock: Math.max(0, v.stock - qty),
              sales: (v.sales || 0) + qty
            }
          })
        }
      })
    )

    const supabase = createClient()
    if (supabase) {
      try {
        // Find variant and deduct stock in Supabase
        const targetProduct = products.find(p => p.id === productId)
        const targetVariant = targetProduct?.variants.find(v => v.color === color)
        if (targetVariant?.id) {
          const newStock = Math.max(0, targetVariant.stock - qty)
          await supabase.from('product_variants').update({ stock_quantity: newStock }).eq('id', targetVariant.id)
        }
      } catch (err) {
        console.error('Failed to deduct stock in Supabase:', err)
      }
    }
  }

  return (
    <ProductContext.Provider value={{ products, deductStock, setProducts, refreshProducts: fetchProductsFromSupabase }}>
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductContext)
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider')
  }
  return context
}
