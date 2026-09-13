'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export type NotificationType =
  | 'quotation_created'
  | 'pending_approval'
  | 'quotation_approved'
  | 'quotation_rejected'
  | 'quotation_completed'
  | 'general'

export type AppNotification = {
  id: string
  type: NotificationType
  targetRole: 'admin' | 'salesperson' | 'all'
  title: string
  message: string
  quotationId?: string
  customerName?: string
  salespersonName?: string
  link: string
  createdAt: string
  read: boolean
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'pending_approval',
    targetRole: 'admin',
    title: 'Discount Approval Required',
    message: 'Ahmad Al Rashid requested a 28% discount on Quotation QT-1005 for Al Safa Trading (SAR 14,200.00).',
    quotationId: 'QT-1005',
    customerName: 'Al Safa Trading',
    salespersonName: 'Ahmad Al Rashid',
    link: '/admin/approvals',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    read: false,
  },
  {
    id: 'notif-2',
    type: 'quotation_created',
    targetRole: 'admin',
    title: 'New Quotation Created',
    message: 'Sarah Chen created new quotation QT-1008 for Al Fanar Ceramics (SAR 18,400.00).',
    quotationId: 'QT-1008',
    customerName: 'Al Fanar Ceramics',
    salespersonName: 'Sarah Chen',
    link: '/admin/quotations',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
  },
  {
    id: 'notif-3',
    type: 'quotation_completed',
    targetRole: 'admin',
    title: 'Order Completed',
    message: 'Quotation QT-1002 for Saudi Ceramic Co. has been marked as Completed (SAR 8,900.00).',
    quotationId: 'QT-1002',
    customerName: 'Saudi Ceramic Co.',
    salespersonName: 'Marcus Johnson',
    link: '/admin/analytics/status/completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: true,
  },
  {
    id: 'notif-4',
    type: 'quotation_approved',
    targetRole: 'salesperson',
    title: 'Quotation Approved by Admin',
    message: 'Admin accepted quotation QT-1005 for Al Safa Trading. You can now send it to the client.',
    quotationId: 'QT-1005',
    customerName: 'Al Safa Trading',
    salespersonName: 'Ahmad Al Rashid',
    link: '/quotations',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    read: false,
  },
]

type NotificationContextType = {
  notifications: AppNotification[]
  unreadCount: (role: 'admin' | 'salesperson') => number
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: (role: 'admin' | 'salesperson') => void
  deleteNotification: (id: string) => void
  clearAll: (role: 'admin' | 'salesperson') => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from local storage initially
  useEffect(() => {
    const loadData = () => {
      const stored = localStorage.getItem('global_notifications_v2')
      if (stored) {
        try {
          setNotifications(JSON.parse(stored))
        } catch {
          setNotifications(INITIAL_NOTIFICATIONS)
        }
      } else {
        setNotifications(INITIAL_NOTIFICATIONS)
        localStorage.setItem('global_notifications_v2', JSON.stringify(INITIAL_NOTIFICATIONS))
      }
      setIsLoaded(true)
    }

    loadData()

    // Sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'global_notifications_v2' && e.newValue) {
        try {
          setNotifications(JSON.parse(e.newValue))
        } catch {}
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Sync to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('global_notifications_v2', JSON.stringify(notifications))
    }
  }, [notifications, isLoaded])

  // Realtime Supabase Listener for live database activity
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const channel = supabase
      .channel('realtime_notifications_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quotations' },
        (payload: any) => {
          const newQ = payload.new
          const qNumber = newQ.quotation_number ? `QT-${1000 + newQ.quotation_number}` : 'New Quotation'

          if (newQ.status === 'Pending Approval' || Number(newQ.discount_total) > 10) {
            addNotification({
              type: 'pending_approval',
              targetRole: 'admin',
              title: 'Discount Approval Required',
              message: `A salesperson requested an approval for ${qNumber} (SAR ${Number(newQ.grand_total).toFixed(2)}).`,
              quotationId: qNumber,
              link: '/admin/approvals',
            })
          } else {
            addNotification({
              type: 'quotation_created',
              targetRole: 'admin',
              title: 'New Quotation Generated',
              message: `New quotation ${qNumber} generated for SAR ${Number(newQ.grand_total).toFixed(2)}.`,
              quotationId: qNumber,
              link: '/admin/quotations',
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quotations' },
        (payload: any) => {
          const updatedQ = payload.new
          const qNumber = updatedQ.quotation_number ? `QT-${1000 + updatedQ.quotation_number}` : 'Quotation'

          if (updatedQ.status === 'Approved' || updatedQ.status === 'Admin Accepted') {
            addNotification({
              type: 'quotation_approved',
              targetRole: 'salesperson',
              title: 'Quotation Approved by Admin',
              message: `Quotation ${qNumber} was approved. You can now send it to the customer.`,
              quotationId: qNumber,
              link: '/quotations',
            })
          } else if (updatedQ.status === 'Rejected') {
            addNotification({
              type: 'quotation_rejected',
              targetRole: 'salesperson',
              title: 'Quotation Discount Rejected',
              message: `Quotation ${qNumber} was rejected by Admin. Please adjust terms.`,
              quotationId: qNumber,
              link: '/quotations',
            })
          } else if (updatedQ.status === 'Completed') {
            addNotification({
              type: 'quotation_completed',
              targetRole: 'all',
              title: 'Order Finalized & Completed',
              message: `Quotation ${qNumber} has been finalized and fulfilled.`,
              quotationId: qNumber,
              link: '/quotations',
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addNotification = (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      read: false,
    }
    setNotifications(prev => [newNotif, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = (role: 'admin' | 'salesperson') => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.targetRole === role || n.targetRole === 'all') {
          return { ...n, read: true }
        }
        return n
      })
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = (role: 'admin' | 'salesperson') => {
    setNotifications(prev =>
      prev.filter(n => n.targetRole !== role && n.targetRole !== 'all')
    )
  }

  const unreadCount = (role: 'admin' | 'salesperson') => {
    return notifications.filter(
      n => !n.read && (n.targetRole === role || n.targetRole === 'all')
    ).length
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
