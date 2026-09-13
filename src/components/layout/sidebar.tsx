'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, FileText, ShoppingCart, Package, LogOut, ChevronRight, Zap, Settings, UserCog, BarChart3 } from 'lucide-react'
import { useLang } from '@/context/lang-context'
import { useAuth } from '@/context/auth-context'

const salespersonNavItems = [
  { titleKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { titleKey: 'nav.customers', href: '/customers', icon: Users },
  { titleKey: 'nav.products', href: '/products', icon: ShoppingCart },
  { titleKey: 'Stock Summary', href: '/products/stock', icon: BarChart3 },
  { titleKey: 'nav.newQuotation', href: '/quotations/new', icon: FileText },
  { titleKey: 'nav.myQuotations', href: '/quotations', icon: Package },
]

const adminNavItems = [
  { titleKey: 'nav.dashboard', href: '/admin', icon: LayoutDashboard },
  { titleKey: 'nav.myQuotations', href: '/admin/quotations', icon: FileText },
  { titleKey: 'nav.customers', href: '/admin/customers', icon: Users },
  { titleKey: 'Manage Products', href: '/admin/products', icon: ShoppingCart },
  { titleKey: 'View Catalog', href: '/admin/catalog', icon: Package },
  { titleKey: 'Users', href: '/admin/users', icon: UserCog },
  { titleKey: 'Settings', href: '/admin/settings', icon: Settings },
]

export function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname()
  const { t, isRtl } = useLang()
  const { displayName, displayRole, initials, signOut } = useAuth()

  const items = userRole === 'admin' ? adminNavItems : salespersonNavItems

  const isActive = (href: string) =>
    ['/quotations', '/admin', '/dashboard', '/products'].includes(href)
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <aside className="w-64 bg-[#0f1623] text-slate-300 h-full flex flex-col hidden md:flex shrink-0 print:hidden">

      {/* ── Logo ── */}
      <div className={cn('px-5 py-5 border-b border-white/[0.06]', isRtl ? 'text-right' : '')}>
        <div className={cn('flex items-center gap-3', isRtl ? 'flex-row-reverse' : '')}>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none">MELAMINE</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">OrderFlow</p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
        <p className={cn('text-[10px] font-bold tracking-widest text-slate-600 uppercase px-3 mb-3', isRtl ? 'text-right' : '')}>
          {t('nav.mainMenu')}
        </p>
        {items.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative',
                isRtl ? 'flex-row-reverse text-right' : '',
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              {/* Active pill indicator — switches side in RTL */}
              {active && !isRtl && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />}
              {active && isRtl && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full" />}

              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all',
                active ? 'bg-white/20' : 'bg-white/[0.04] group-hover:bg-white/[0.08]'
              )}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="flex-1">{t(item.titleKey)}</span>
              {active && <ChevronRight className={cn('w-3.5 h-3.5 opacity-60', isRtl ? 'rotate-180' : '')} />}
            </Link>
          )
        })}
      </div>

      {/* ── User Profile ── */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className={cn('flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.04] mb-2', isRtl ? 'flex-row-reverse' : '')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-violet-900/40 shrink-0">
            {initials}
          </div>
          <div className={cn('flex-1 min-w-0', isRtl ? 'text-right' : '')}>
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-[10px] text-slate-500">{userRole === 'admin' ? 'Administrator' : displayRole}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all group text-left',
            isRtl ? 'flex-row-reverse' : ''
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] group-hover:bg-red-500/10 flex items-center justify-center shrink-0 transition-all">
            <LogOut className="w-4 h-4" />
          </div>
          {t('nav.signOut')}
        </button>
      </div>
    </aside>
  )
}
