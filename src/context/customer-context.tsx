'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Customer = {
  id: string
  name: string
  nameAr?: string
  contact_person: string
  mobile_no: string
  email: string
  address?: string
  vat_no?: string
  cr_no?: string
  vat?: string
  cr?: string
  notes?: string
  orders: number
}

const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Al Muhaidib Kitchens', contact_person: 'Khalid Al Muhaidib', mobile_no: '+966 13 812 3456', email: 'khalid@almuhaidib.com.sa', address: 'King Fahd Road, Al Khobar 31952', vat_no: '310123456700003', cr_no: '1010123456789', orders: 12 },
  { id: '2', name: 'Raha Kitchen Solutions', contact_person: 'Faisal Al Ghamdi', mobile_no: '+966 13 823 4567', email: 'faisal@raha-kitchens.sa', address: 'Dhahran St, Dammam', orders: 4 },
  { id: '3', name: 'Eastern Kitchens Factory', contact_person: 'Omar Al Dossari', mobile_no: '+966 13 834 5678', email: 'omar@eastern-kitchens.sa', address: 'Industrial Area, Jubail', orders: 8 },
  { id: '4', name: 'Gulf Modular Kitchens', contact_person: 'Sultan Al Harbi', mobile_no: '+966 13 845 6789', email: 'sultan@gulfmodular.sa', address: 'Prince Faisal St, Riyadh', orders: 3 },
  { id: '5', name: 'Al Jazeera Kitchen World', contact_person: 'Mohammed Al Qahtani', mobile_no: '+966 13 856 7890', email: 'mohammed@aljazeerakitchen.sa', address: 'Olaya District, Riyadh', orders: 6 },
]

type CustomerContextType = {
  customers: Customer[]
  addCustomer: (c: Customer) => Promise<void>
  updateCustomer: (c: Customer) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  refreshCustomers: () => Promise<void>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS)
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchCustomersFromSupabase = async () => {
    const supabase = createClient()
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (data && !error && data.length > 0) {
        const formatted: Customer[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          contact_person: c.name,
          mobile_no: c.mobile_no || '',
          email: c.email || '',
          address: c.address || '',
          vat_no: c.vat_no || '',
          cr_no: c.cr_no || '',
          orders: 0,
        }))
        setCustomers(formatted)
        localStorage.setItem('global_customers', JSON.stringify(formatted))
      } else if (data && data.length === 0) {
        // Table is empty in Supabase, load and sync initial demo customers
        setCustomers(INITIAL_CUSTOMERS)
        localStorage.setItem('global_customers', JSON.stringify(INITIAL_CUSTOMERS))
      }
    } catch (err) {
      console.error('Error fetching customers from Supabase:', err)
    }
  }

  useEffect(() => {
    // Initial local cache load for instantaneous UI rendering
    const stored = localStorage.getItem('global_customers')
    if (stored) {
      try {
        setCustomers(JSON.parse(stored))
      } catch {
        setCustomers(INITIAL_CUSTOMERS)
      }
    }
    setIsLoaded(true)

    // Fetch live from Supabase
    fetchCustomersFromSupabase()

    // Setup Supabase Realtime Listener
    const supabase = createClient()
    if (!supabase) return

    const channel = supabase
      .channel('realtime_customers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (_payload: any) => {
          fetchCustomersFromSupabase()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addCustomer = async (c: Customer) => {
    // Optimistic UI update
    setCustomers(prev => [c, ...prev])
    localStorage.setItem('global_customers', JSON.stringify([c, ...customers]))

    const supabase = createClient()
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('customers').insert({
          id: c.id.length > 10 ? c.id : undefined,
          name: c.name,
          address: c.address,
          mobile_no: c.mobile_no,
          email: c.email,
          vat_no: c.vat_no || c.vat,
          cr_no: c.cr_no || c.cr,
          created_by: user?.id,
        })
      } catch (err) {
        console.error('Failed to insert customer to Supabase:', err)
      }
    }
  }

  const updateCustomer = async (c: Customer) => {
    setCustomers(prev => prev.map(existing => existing.id === c.id ? c : existing))
    localStorage.setItem('global_customers', JSON.stringify(customers.map(existing => existing.id === c.id ? c : existing)))

    const supabase = createClient()
    if (supabase) {
      try {
        await supabase.from('customers').update({
          name: c.name,
          address: c.address,
          mobile_no: c.mobile_no,
          email: c.email,
          vat_no: c.vat_no || c.vat,
          cr_no: c.cr_no || c.cr,
        }).eq('id', c.id)
      } catch (err) {
        console.error('Failed to update customer in Supabase:', err)
      }
    }
  }

  const deleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id))
    localStorage.setItem('global_customers', JSON.stringify(customers.filter(c => c.id !== id)))

    const supabase = createClient()
    if (supabase) {
      try {
        await supabase.from('customers').delete().eq('id', id)
      } catch (err) {
        console.error('Failed to delete customer in Supabase:', err)
      }
    }
  }

  return (
    <CustomerContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        refreshCustomers: fetchCustomersFromSupabase,
      }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomers() {
  const context = useContext(CustomerContext)
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider')
  }
  return context
}
