'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useLang } from '@/context/lang-context'

export default function SalespersonLayout({ children }: { children: React.ReactNode }) {
  const { isRtl } = useLang()

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
      <Sidebar userRole="salesperson" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
