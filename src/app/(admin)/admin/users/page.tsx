'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Pencil, Trash2, Plus, Users, UserCheck, UserX,
  Search, X, AlertTriangle, ShieldCheck, Mail, CheckCircle2
} from 'lucide-react'
import { useLang } from '@/context/lang-context'

export type UserStatus = 'Active' | 'Inactive'

export type TeamUser = {
  id: number
  initials: string
  name: string
  email: string
  role: string
  lastLogin: string
  status: UserStatus
  color: string
}

const DEFAULT_USERS: TeamUser[] = [
  { id: 1, initials: 'SC', name: 'Sarah Chen', email: 'sarah.chen@melamine.com', role: 'Sales Manager', lastLogin: '18 Dec 2024, 08:34 AM', status: 'Active', color: 'from-blue-500 to-blue-700' },
  { id: 2, initials: 'MJ', name: 'Marcus Johnson', email: 'marcus.j@melamine.com', role: 'Senior Sales', lastLogin: '18 Dec 2024, 03:15 AM', status: 'Active', color: 'from-indigo-500 to-indigo-700' },
  { id: 3, initials: 'PP', name: 'Priya Patel', email: 'priya.p@melamine.com', role: 'Sales Executive', lastLogin: '17 Dec 2024, 05:30 PM', status: 'Active', color: 'from-purple-500 to-purple-700' },
  { id: 4, initials: 'AT', name: 'Andrew Teo', email: 'andrew.teo@melamine.com', role: 'Office Manager', lastLogin: '13 Dec 2024, 02:20 AM', status: 'Active', color: 'from-cyan-500 to-cyan-700' },
  { id: 5, initials: 'DK', name: 'Diana Ken', email: 'diana.k@melamine.com', role: 'Office Staff', lastLogin: '18 Dec 2024, 08:32 AM', status: 'Active', color: 'from-pink-500 to-pink-700' },
  { id: 6, initials: 'RL', name: 'Ryan Lim', email: 'ryan.lim@melamine.com', role: 'Sales Executive', lastLogin: '28 Nov 2024, 04:10 PM', status: 'Inactive', color: 'from-slate-400 to-slate-600' },
]

const COLOR_OPTIONS = [
  'from-blue-500 to-blue-700',
  'from-indigo-500 to-indigo-700',
  'from-purple-500 to-purple-700',
  'from-cyan-500 to-cyan-700',
  'from-emerald-500 to-teal-700',
  'from-pink-500 to-rose-700',
  'from-amber-500 to-orange-700',
]

const ROLE_OPTIONS = [
  'Sales Manager',
  'Senior Sales',
  'Sales Executive',
  'Office Manager',
  'Office Staff',
  'Administrator',
]

export default function AdminUsersPage() {
  const { isRtl } = useLang()
  const [users, setUsers] = useState<TeamUser[]>(DEFAULT_USERS)
  const [isLoaded, setIsLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All')

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<TeamUser | null>(null)

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Sales Executive',
    status: 'Active' as UserStatus,
  })

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('admin_users_list_v2')
    if (saved) {
      try {
        setUsers(JSON.parse(saved))
      } catch (e) {
        setUsers(DEFAULT_USERS)
      }
    } else {
      setUsers(DEFAULT_USERS)
    }
    setIsLoaded(true)
  }, [])

  // Save to local storage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('admin_users_list_v2', JSON.stringify(users))
    }
  }, [users, isLoaded])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      role: 'Sales Executive',
      status: 'Active',
    })
    setIsFormModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (u: TeamUser) => {
    setEditingUser(u)
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
    })
    setIsFormModalOpen(true)
  }

  // Generate Initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase() || 'US'
  }

  // Save User (Create or Update)
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) return

    if (editingUser) {
      // Update
      setUsers(prev => prev.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            name: formData.name.trim(),
            email: formData.email.trim(),
            role: formData.role,
            status: formData.status,
            initials: getInitials(formData.name),
          }
        }
        return u
      }))
    } else {
      // Create new
      const randomColor = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]
      const newUser: TeamUser = {
        id: Date.now(),
        initials: getInitials(formData.name),
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        lastLogin: 'Never logged in',
        status: formData.status,
        color: randomColor,
      }
      setUsers(prev => [newUser, ...prev])
    }

    setIsFormModalOpen(false)
  }

  // Confirm Delete Action
  const handleConfirmDelete = () => {
    if (!userToDelete) return
    setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
    setUserToDelete(null)
  }

  // Filtering
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'All' || u.role === roleFilter
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'Active').length
  const inactiveUsers = users.filter(u => u.status === 'Inactive').length

  return (
    <div className="space-y-6 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">User Management</h2>
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {totalUsers} Members
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Manage team credentials, roles, access permissions, and account statuses</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 rounded-xl font-bold px-4"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add User
        </Button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setStatusFilter('All')}
          className={`cursor-pointer transition-all bg-white dark:bg-slate-900 rounded-2xl p-5 border ${
            statusFilter === 'All' ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-semibold text-slate-600 dark:text-slate-400 text-sm">Total Users</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalUsers}</p>
          <p className="text-[11px] text-slate-400 mt-1">All registered system team accounts</p>
        </div>

        <div
          onClick={() => setStatusFilter('Active')}
          className={`cursor-pointer transition-all bg-white dark:bg-slate-900 rounded-2xl p-5 border ${
            statusFilter === 'Active' ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500' : 'border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="font-semibold text-slate-600 dark:text-slate-400 text-sm">Active Members</span>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{activeUsers}</p>
          <p className="text-[11px] text-slate-400 mt-1">Full access to create & manage quotations</p>
        </div>

        <div
          onClick={() => setStatusFilter('Inactive')}
          className={`cursor-pointer transition-all bg-white dark:bg-slate-900 rounded-2xl p-5 border ${
            statusFilter === 'Inactive' ? 'border-rose-500 shadow-md ring-1 ring-rose-500' : 'border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
              <UserX className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            </div>
            <span className="font-semibold text-slate-600 dark:text-slate-400 text-sm">Inactive Accounts</span>
          </div>
          <p className="text-3xl font-black text-rose-500 dark:text-rose-400 tracking-tight">{inactiveUsers}</p>
          <p className="text-[11px] text-slate-400 mt-1">Temporarily suspended or disabled</p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Roles</option>
          {ROLE_OPTIONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* ── Users Table ── */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <th className="px-6 py-4 text-start">User</th>
                <th className="px-6 py-4 text-start">Email Address</th>
                <th className="px-6 py-4 text-start">Role</th>
                <th className="px-6 py-4 text-start">Last Login</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 opacity-30 mx-auto mb-2" />
                    <p className="font-semibold text-sm">No users found</p>
                    <p className="text-xs text-slate-400">Try changing your search query or filters</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className={`transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      u.status === 'Inactive' ? 'opacity-70 bg-slate-50/40 dark:bg-slate-900/40' : ''
                    }`}
                  >
                    {/* User Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${u.color} flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0`}>
                          {u.initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono sm:hidden">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium font-mono text-xs">
                      {u.email}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {u.role}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {u.lastLogin}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        u.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {u.status}
                      </span>
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          title="Edit User"
                          onClick={() => handleOpenEdit(u)}
                          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-500 hover:text-blue-600 border border-slate-200 dark:border-slate-700 hover:border-blue-200 flex items-center justify-center transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          title="Delete User"
                          onClick={() => setUserToDelete(u)}
                          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-500 hover:text-rose-600 border border-slate-200 dark:border-slate-700 hover:border-rose-200 flex items-center justify-center transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── CREATE / EDIT USER MODAL ── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  {editingUser ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editingUser ? 'Edit User Details' : 'Add New Team Member'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingUser ? 'Update account info and role' : 'Create login and assign role'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Chen"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah.chen@melamine.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ROLE_OPTIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as UserStatus }))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-xl font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/25 px-5"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION POP-UP MODAL ── */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-100 dark:border-rose-950/40 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete User Account?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete this user? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* User Details Preview Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${userToDelete.color} flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0`}>
                {userToDelete.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{userToDelete.name}</p>
                <p className="text-xs text-slate-400 truncate">{userToDelete.email}</p>
                <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded mt-1">
                  {userToDelete.role}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setUserToDelete(null)}
                className="rounded-xl font-semibold px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/30 px-5"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Yes, Delete User
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

