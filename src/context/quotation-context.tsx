'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export type QuotationItem = {
  id?: string
  productId?: string
  item_no?: string
  productName?: string
  color?: string
  quantity: number
  unitPrice: number
  unit_price_snapshot?: number
  discount_percentage?: number
  discount_amount?: number
  line_amount: number
}

export type Quotation = {
  id: string
  customer_id?: string
  customerName: string
  salesperson_id?: string
  salesperson: string
  date: string
  discount: number
  discount_total?: number
  subtotal?: number
  vat_amount?: number
  grandTotal: number
  status: string // 'Draft', 'Pending Approval', 'Approved', 'Rejected', 'Sent', 'Customer Accepted', 'Completed', 'Cancelled'
  items?: any[]
  remarks?: string
  paymentTerms?: string
  deliveryTerms?: string
  created_at?: string
}

const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'QT-1001',
    customerName: 'Al Muhaidib Kitchens',
    salesperson: 'Ahmad Al Rashid',
    date: '2026-09-10',
    discount: 5,
    grandTotal: 14500.00,
    status: 'Completed',
  },
  {
    id: 'QT-1002',
    customerName: 'Raha Kitchen Solutions',
    salesperson: 'Ahmad Al Rashid',
    date: '2026-09-11',
    discount: 8,
    grandTotal: 8900.00,
    status: 'Pending Approval',
  },
  {
    id: 'QT-1003',
    customerName: 'Eastern Kitchens Factory',
    salesperson: 'Abdul Khabeer',
    date: '2026-09-12',
    discount: 0,
    grandTotal: 22300.00,
    status: 'Approved',
  },
]

type QuotationContextType = {
  quotations: Quotation[]
  addQuotation: (q: Quotation) => Promise<void>
  updateStatus: (id: string, status: string) => Promise<void>
  deleteQuotation: (id: string) => Promise<void>
  refreshQuotations: () => Promise<void>
}

const QuotationContext = createContext<QuotationContextType | undefined>(undefined)

export function QuotationProvider({ children }: { children: ReactNode }) {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchQuotationsFromSupabase = async () => {
    const supabase = createClient()
    if (!supabase) return

    try {
      const { data: dbQuotations, error } = await supabase
        .from('quotations')
        .select(`
          id,
          quotation_number,
          customer_id,
          salesperson_id,
          status,
          subtotal,
          discount_total,
          net_amount,
          vat_amount,
          grand_total,
          payment_terms,
          delivery_terms,
          remarks,
          created_at,
          customers (
            id,
            name
          ),
          profiles (
            id,
            full_name,
            email
          ),
          quotation_items (
            id,
            product_variant_id,
            quantity,
            unit_price_snapshot,
            discount_percentage,
            discount_amount,
            line_amount
          )
        `)
        .order('created_at', { ascending: false })

      if (dbQuotations && !error && dbQuotations.length > 0) {
        const formatted: Quotation[] = dbQuotations.map((q: any) => {
          const qNumber = q.quotation_number ? `QT-${1000 + q.quotation_number}` : q.id.substring(0, 8).toUpperCase()
          return {
            id: qNumber,
            customer_id: q.customer_id,
            customerName: q.customers?.name || 'Customer',
            salesperson_id: q.salesperson_id,
            salesperson: q.profiles?.full_name || 'Sales Representative',
            date: q.created_at ? new Date(q.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            discount: Number(q.discount_total) || 0,
            grandTotal: Number(q.grand_total) || 0,
            subtotal: Number(q.subtotal) || 0,
            vat_amount: Number(q.vat_amount) || 0,
            status: q.status || 'Draft',
            paymentTerms: q.payment_terms || '',
            deliveryTerms: q.delivery_terms || '',
            remarks: q.remarks || '',
            items: q.quotation_items || [],
            created_at: q.created_at,
          }
        })
        setQuotations(formatted)
        localStorage.setItem('global_quotations_v2', JSON.stringify(formatted))
      } else if (dbQuotations && dbQuotations.length === 0) {
        // Fallback to local storage or initial
        const stored = localStorage.getItem('global_quotations_v2')
        if (stored) {
          setQuotations(JSON.parse(stored))
        } else {
          setQuotations(INITIAL_QUOTATIONS)
        }
      }
    } catch (err) {
      console.error('Error fetching quotations from Supabase:', err)
    }
  }

  useEffect(() => {
    // Initial load from local storage
    const stored = localStorage.getItem('global_quotations_v2')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setQuotations(parsed)
      } catch {
        setQuotations(INITIAL_QUOTATIONS)
      }
    } else {
      setQuotations(INITIAL_QUOTATIONS)
    }
    setIsLoaded(true)

    // Live Supabase fetch
    fetchQuotationsFromSupabase()

    // Realtime Supabase Channel
    const supabase = createClient()
    if (!supabase) return

    const channel = supabase
      .channel('realtime_quotations_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotations' },
        (_payload: any) => {
          fetchQuotationsFromSupabase()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotation_items' },
        (_payload: any) => {
          fetchQuotationsFromSupabase()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'discount_approvals' },
        (_payload: any) => {
          fetchQuotationsFromSupabase()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addQuotation = async (q: Quotation) => {
    // Optimistic UI state update (salesperson's browser)
    setQuotations(prev => {
      const filtered = prev.filter(existing => existing.id !== q.id)
      return [q, ...filtered]
    })
    localStorage.setItem('global_quotations_v2', JSON.stringify([q, ...quotations]))

    const supabase = createClient()
    if (!supabase) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('addQuotation: no authenticated user')
        return
      }

      // Find or create customer UUID
      let customerUuid = q.customer_id
      if (!customerUuid || customerUuid.length < 10) {
        const { data: foundCust } = await supabase
          .from('customers')
          .select('id')
          .ilike('name', `%${q.customerName}%`)
          .maybeSingle()

        if (foundCust) {
          customerUuid = foundCust.id
        } else {
          const { data: newCust, error: custErr } = await supabase.from('customers').insert({
            name: q.customerName,
            created_by: user.id,
          }).select('id').single()
          if (custErr) console.error('addQuotation: failed to create customer', custErr)
          customerUuid = newCust?.id
        }
      }

      if (!customerUuid) {
        console.error('addQuotation: no customer UUID, skipping Supabase insert')
        return
      }

      // q.discount is the max discount percentage (e.g. 26)
      // q.discount_total is the total SAR discount amount
      const maxDiscountPct = q.discount || 0
      const discountSarAmount = q.discount_total || 0

      const { data: insertedQuotation, error: qErr } = await supabase.from('quotations').insert({
        customer_id: customerUuid,
        salesperson_id: user.id,
        status: q.status || 'Draft',
        subtotal: q.subtotal || 0,
        discount_total: discountSarAmount,
        net_amount: q.grandTotal / 1.15,
        vat_rate: 15.00,
        vat_amount: q.vat_amount || (q.grandTotal - q.grandTotal / 1.15),
        grand_total: q.grandTotal,
        payment_terms: q.paymentTerms,
        delivery_terms: q.deliveryTerms,
        remarks: q.remarks,
      }).select('id, quotation_number').single()

      if (qErr || !insertedQuotation) {
        console.error('addQuotation: Supabase insert failed', qErr)
        return
      }

      // Create discount_approval record if needed
      if (q.status === 'Pending Approval' || maxDiscountPct > 25) {
        const { error: daErr } = await supabase.from('discount_approvals').insert({
          quotation_id: insertedQuotation.id,
          status: 'Pending',
        })
        if (daErr) console.error('addQuotation: discount_approvals insert failed', daErr)
      }

      // Update local state with the real quotation number from DB so IDs stay in sync
      if (insertedQuotation.quotation_number) {
        const dbId = `QT-${1000 + insertedQuotation.quotation_number}`
        setQuotations(prev => prev.map(existing =>
          existing.id === q.id ? { ...existing, id: dbId } : existing
        ))
      }
    } catch (err) {
      console.error('addQuotation: unexpected error', err)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    // Optimistic UI state update
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status } : q))
    localStorage.setItem('global_quotations_v2', JSON.stringify(quotations.map(q => q.id === id ? { ...q, status } : q)))

    const supabase = createClient()
    if (supabase) {
      try {
        // If id is in QT-100X format, extract quotation_number or update by match
        const qNum = parseInt(id.replace('QT-', '')) - 1000
        if (!isNaN(qNum) && qNum > 0) {
          await supabase.from('quotations').update({ status }).eq('quotation_number', qNum)
        } else if (id.length > 20) {
          await supabase.from('quotations').update({ status }).eq('id', id)
        }
      } catch (err) {
        console.error('Failed to update quotation status in Supabase:', err)
      }
    }
  }

  const deleteQuotation = async (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id))
    localStorage.setItem('global_quotations_v2', JSON.stringify(quotations.filter(q => q.id !== id)))

    const supabase = createClient()
    if (supabase) {
      try {
        const qNum = parseInt(id.replace('QT-', '')) - 1000
        if (!isNaN(qNum) && qNum > 0) {
          await supabase.from('quotations').delete().eq('quotation_number', qNum)
        } else if (id.length > 20) {
          await supabase.from('quotations').delete().eq('id', id)
        }
      } catch (err) {
        console.error('Failed to delete quotation from Supabase:', err)
      }
    }
  }

  return (
    <QuotationContext.Provider
      value={{
        quotations,
        addQuotation,
        updateStatus,
        deleteQuotation,
        refreshQuotations: fetchQuotationsFromSupabase,
      }}
    >
      {children}
    </QuotationContext.Provider>
  )
}

export function useQuotations() {
  const context = useContext(QuotationContext)
  if (context === undefined) {
    throw new Error('useQuotations must be used within a QuotationProvider')
  }
  return context
}
