import { useState, useRef, useEffect } from 'react'
import {
  Menu, X, LayoutDashboard, Users, FileText, ShoppingCart,
  LogOut, Package, Bell, ChevronDown, Zap, CheckCircle2,
  Clock, XCircle, Trash2, Check, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '@/context/lang-context'
import { useNotifications, AppNotification } from '@/context/notification-context'
import { useAuth } from '@/context/auth-context'

const navItems = [
  { titleKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { titleKey: 'nav.customers', href: '/customers', icon: Users },
  { titleKey: 'nav.products', href: '/products', icon: ShoppingCart },
  { titleKey: 'nav.newQuotation', href: '/quotations/new', icon: FileText },
  { titleKey: 'nav.myQuotations', href: '/quotations', icon: Package },
]

function formatTimeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [notifTab, setNotifTab] = useState<'all' | 'unread'>('all')
  const notifRef = useRef<HTMLDivElement>(null)

  const pathname = usePathname()
  const router = useRouter()
  const { lang, setLang, t, isRtl } = useLang()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications()
  const { displayName, displayRole, initials, signOut } = useAuth()

  const isAdmin = pathname.startsWith('/admin')
  const currentRole: 'admin' | 'salesperson' = isAdmin ? 'admin' : 'salesperson'
  const userName = displayName
  const userInitials = initials
  const userRole = isAdmin ? 'Administrator' : displayRole

  const unreadNum = unreadCount(currentRole)

  // Filter role-relevant notifications
  const roleNotifications = notifications.filter(
    n => n.targetRole === currentRole || n.targetRole === 'all'
  )

  const displayedNotifications = roleNotifications.filter(n => {
    if (notifTab === 'unread') return !n.read
    return true
  })

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false)
      }
    }
    if (notifDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifDropdownOpen])

  const handleNotificationClick = (n: AppNotification) => {
    markAsRead(n.id)
    setNotifDropdownOpen(false)
    if (n.link) {
      router.push(n.link)
    }
  }

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'pending_approval':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        )
      case 'quotation_approved':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )
      case 'quotation_rejected':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
        )
      case 'quotation_completed':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        )
    }
  }

  const isActive = (href: string) =>
    ['/quotations', '/admin', '/dashboard'].includes(href)
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <header className="h-16 border-b bg-white dark:bg-slate-950 flex items-center px-4 md:px-6 sticky top-0 z-30 shadow-sm gap-3 print:hidden">
        {/* Mobile hamburger */}
        <Button variant="ghost" size="icon" className="md:hidden text-slate-600 shrink-0" onClick={() => setMobileMenuOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>

        {/* Mobile logo */}
        <div className="md:hidden font-black text-lg text-blue-700 tracking-tight">MELAMINE</div>

        <div className="flex-1" />

        {/* Right side items */}
        <div className="flex items-center gap-3">

          {/* Language Toggle */}
          <div className="flex items-center border rounded-full overflow-hidden text-xs font-semibold divide-x bg-slate-50 dark:bg-slate-900">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 transition-all ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ar')}
              className={`px-3 py-1.5 transition-all font-medium ${lang === 'ar' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              style={{ fontFamily: 'Tahoma, Arial' }}
            >
              العربية
            </button>
          </div>

          {/* ── Notification Bell with Dropdown Popover ── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifDropdownOpen(prev => !prev)}
              className={`relative p-2.5 rounded-xl transition-all ${
                notifDropdownOpen
                  ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bell className="w-5 h-5" />
              {unreadNum > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none shadow-sm animate-pulse">
                  {unreadNum > 9 ? '9+' : unreadNum}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {notifDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {/* Popover Header */}
                <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
                    {unreadNum > 0 && (
                      <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadNum} New
                      </span>
                    )}
                  </div>
                  {unreadNum > 0 && (
                    <button
                      onClick={() => markAllAsRead(currentRole)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                {/* Tabs Filter */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 pt-2 gap-4 text-xs font-semibold">
                  <button
                    onClick={() => setNotifTab('all')}
                    className={`pb-2 border-b-2 transition-all ${
                      notifTab === 'all'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    All ({roleNotifications.length})
                  </button>
                  <button
                    onClick={() => setNotifTab('unread')}
                    className={`pb-2 border-b-2 transition-all ${
                      notifTab === 'unread'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Unread ({unreadNum})
                  </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {displayedNotifications.length === 0 ? (
                    <div className="py-12 px-4 text-center text-slate-400">
                      <Bell className="w-8 h-8 opacity-20 mx-auto mb-2" />
                      <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">No notifications</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {notifTab === 'unread' ? "You're all caught up!" : 'No recent updates at this time'}
                      </p>
                    </div>
                  ) : (
                    displayedNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group relative ${
                          !n.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        {/* Unread indicator dot */}
                        {!n.read && (
                          <span className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full bg-blue-600" />
                        )}

                        {getNotifIcon(n.type)}

                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {n.title}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-snug">
                            {n.message}
                          </p>
                          {n.quotationId && (
                            <span className="inline-block text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded mt-1.5">
                              {n.quotationId}
                            </span>
                          )}
                        </div>

                        {/* Delete single notification */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(n.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition-opacity absolute right-2 top-3"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Popover Footer */}
                {roleNotifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between text-xs">
                    <button
                      onClick={() => clearAll(currentRole)}
                      className="text-slate-400 hover:text-rose-600 font-medium transition-colors text-[11px]"
                    >
                      Clear all notifications
                    </button>
                    <Link
                      href={isAdmin ? "/admin/approvals" : "/quotations"}
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1"
                    >
                      {isAdmin ? 'View Approvals' : 'View Quotations'} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile */}
          <Link href={isAdmin ? "/admin/settings" : "/profile"} className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-black shadow-md shrink-0">
              {userInitials}
            </div>
            <div className="hidden sm:block text-right" dir="ltr">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{userName}</p>
              <p className="text-[11px] text-slate-400 leading-tight">{userRole}</p>
            </div>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </Link>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" dir={isRtl ? 'rtl' : 'ltr'}>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

          {/* The mobile drawer — RTL: slides from right; LTR: slides from left */}
          <div className={`relative w-72 max-w-[80vw] bg-[#0f1623] text-slate-300 h-full flex flex-col shadow-2xl ${isRtl ? 'mr-0 ml-auto animate-in slide-in-from-right' : 'animate-in slide-in-from-left'}`}>
            
            <div className={`px-5 py-5 border-b border-white/[0.06] flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-white tracking-tight leading-none">MELAMINE</h1>
                  <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">OrderFlow</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
              <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase px-3 mb-3">{t('nav.mainMenu')}</p>
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                      active
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                        : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {active && !isRtl && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />}
                    {active && isRtl && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full" />}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-white/20' : 'bg-white/[0.04]'}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="flex-1">{t(item.titleKey)}</span>
                  </Link>
                )
              })}
            </div>

            <div className="px-3 py-4 border-t border-white/[0.06]">
              <Link href={isAdmin ? "/admin/settings" : "/profile"} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.04] mb-2 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-black shadow-lg shrink-0">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{userName}</p>
                  <p className="text-[10px] text-slate-500">{userRole}</p>
                </div>
              </Link>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4" />
                </div>
                {t('nav.signOut')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
