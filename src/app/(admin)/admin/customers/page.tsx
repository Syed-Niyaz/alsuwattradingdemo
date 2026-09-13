'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, Pencil, Plus, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useLang } from '@/context/lang-context'
import { useCustomers, Customer } from '@/context/customer-context'
import { useQuotations } from '@/context/quotation-context'

export default function AdminCustomersPage() {
  const { isRtl } = useLang()
  const { customers, updateCustomer, addCustomer } = useCustomers()
  const { quotations } = useQuotations()
  const [search, setSearch] = useState('')
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editForm, setEditForm] = useState<Customer | null>(null)
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', contact_person: '', mobile_no: '', email: '', vat_no: '', cr_no: '', address: '' })

  const filtered = customers.filter(c =>
    (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
    (c.contact_person && c.contact_person.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Customers</h2>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} registered customers</p>
        </div>
        <Button onClick={() => setIsAddingCustomer(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
      </div>

      <Card className="border-none shadow-sm shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        {/* Search bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800 border-transparent focus:border-blue-300 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4 text-start">Company</th>
                <th className="px-6 py-4 text-start">Contact Person</th>
                <th className="px-6 py-4 text-start">Phone</th>
                <th className="px-6 py-4 text-start">Email</th>
                <th className="px-6 py-4 text-start">Address</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No customers found.
                  </td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 cursor-pointer transition-colors">{c.name}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-blue-600 cursor-pointer hover:underline">{c.contact_person}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{c.mobile_no}</td>
                  <td className="px-6 py-4 text-blue-500 hover:underline cursor-pointer">{c.email}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs max-w-[200px] truncate">{c.address || '—'}</td>
                  <td className="px-6 py-4 text-center">
                    {(() => {
                      const count = quotations.filter(q => q.customerName === c.name || q.customerName === c.nameAr).length;
                      return (
                        <span className={`font-bold text-sm ${count === 0 ? 'text-slate-400' : count > 30 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {count}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/admin/customers/${c.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setEditingCustomer(c)
                          setEditForm({ ...c })
                        }}
                        className="h-8 w-8 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Customer Modal */}
      {editingCustomer && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setEditingCustomer(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Customer</h3>
                <p className="text-xs text-slate-400 mt-0.5">Editing: <span className="font-semibold text-blue-600">{editingCustomer.name}</span></p>
              </div>
              <button 
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-500 transition-colors rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Company <span className="text-red-500">*</span></label>
                  <Input value={editForm.name} onChange={e => setEditForm(f => f ? {...f, name: e.target.value} : f)} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contact Person <span className="text-red-500">*</span></label>
                  <Input value={editForm.contact_person} onChange={e => setEditForm(f => f ? {...f, contact_person: e.target.value} : f)} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone <span className="text-red-500">*</span></label>
                  <Input value={editForm.mobile_no} onChange={e => setEditForm(f => f ? {...f, mobile_no: e.target.value} : f)} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                  <Input type="email" value={editForm.email} onChange={e => setEditForm(f => f ? {...f, email: e.target.value} : f)} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Customer VAT Number</label>
                  <Input value={editForm.vat_no || ''} onChange={e => setEditForm(f => f ? {...f, vat_no: e.target.value} : f)} className="h-10" placeholder="15-digit VAT number" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Customer CR Number</label>
                  <Input value={editForm.cr_no || ''} onChange={e => setEditForm(f => f ? {...f, cr_no: e.target.value} : f)} className="h-10" placeholder="Commercial Registration" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Address</label>
                  <Input value={editForm.address || ''} onChange={e => setEditForm(f => f ? {...f, address: e.target.value} : f)} className="h-10" />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingCustomer(null)} className="h-10 px-5 font-semibold">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editForm) {
                    updateCustomer(editForm)
                    setEditingCustomer(null)
                  }
                }}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsAddingCustomer(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Customer</h3>
              <button 
                onClick={() => setIsAddingCustomer(false)}
                className="text-slate-400 hover:text-slate-500 transition-colors rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Company <span className="text-red-500">*</span></label>
                  <Input value={addForm.name} onChange={e => setAddForm(f => ({...f, name: e.target.value}))} placeholder="Enter company name" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contact Person <span className="text-red-500">*</span></label>
                  <Input value={addForm.contact_person} onChange={e => setAddForm(f => ({...f, contact_person: e.target.value}))} placeholder="Enter contact name" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone <span className="text-red-500">*</span></label>
                  <Input value={addForm.mobile_no} onChange={e => setAddForm(f => ({...f, mobile_no: e.target.value}))} placeholder="e.g. +966 12 345 6789" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                  <Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({...f, email: e.target.value}))} placeholder="email@example.com" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Customer VAT Number</label>
                  <Input value={addForm.vat_no} onChange={e => setAddForm(f => ({...f, vat_no: e.target.value}))} placeholder="15-digit VAT number" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Customer CR Number</label>
                  <Input value={addForm.cr_no} onChange={e => setAddForm(f => ({...f, cr_no: e.target.value}))} placeholder="Commercial Registration" className="h-10" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Address</label>
                  <Input value={addForm.address} onChange={e => setAddForm(f => ({...f, address: e.target.value}))} placeholder="Full business address" className="h-10" />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddingCustomer(false)} className="h-10 px-5 font-semibold">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!addForm.name || !addForm.contact_person || !addForm.mobile_no) return
                  addCustomer({
                    id: 'admin-' + Date.now(),
                    name: addForm.name,
                    contact_person: addForm.contact_person,
                    mobile_no: addForm.mobile_no,
                    email: addForm.email,
                    vat_no: addForm.vat_no,
                    cr_no: addForm.cr_no,
                    address: addForm.address,
                    orders: 0
                  })
                  setAddForm({ name: '', contact_person: '', mobile_no: '', email: '', vat_no: '', cr_no: '', address: '' })
                  setIsAddingCustomer(false)
                }}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Save Customer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
