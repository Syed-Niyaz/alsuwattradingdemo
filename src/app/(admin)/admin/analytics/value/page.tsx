'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsValueRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/analytics/status/completed') }, [router])
  return (
    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
      Redirecting to Completed Quotations Analytics…
    </div>
  )
}
