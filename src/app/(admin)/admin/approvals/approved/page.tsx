'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useQuotations } from '@/context/quotation-context'

export default function ApprovedQuotationsPage() {
  const { quotations } = useQuotations()

  const approvedQuotations = quotations.filter(q => q.status === 'Admin Accepted')

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center text-xs text-slate-500 mb-2 font-medium">
          <Link href="/admin/approvals" className="hover:text-blue-600 transition-colors">Approvals</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 dark:text-slate-200">Approved Quotations</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/approvals">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Approved Quotations</h2>
            <p className="text-muted-foreground">History of quotations that were accepted by an administrator.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {approvedQuotations.length > 0 ? (
          approvedQuotations.map(approval => (
            <Card key={approval.id} className="border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <CardHeader className="flex flex-row items-start justify-between pb-2 pl-6">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {approval.id}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Requested by {approval.salesperson}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-muted-foreground">Total: SAR {approval.grandTotal.toFixed(2)}</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Discount Approved: {approval.discount}%</div>
                </div>
              </CardHeader>
              <CardContent className="pl-6">
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-emerald-50 dark:border-emerald-900/20">
                  <div className="text-sm text-muted-foreground">
                    Customer: <span className="font-medium text-foreground">{approval.customerName}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/quotations/${approval.id}`}>
                      <Button variant="outline" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 shadow-sm">
                        <Eye className="w-4 h-4 mr-1.5" /> View Quotation
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No approved quotations found yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
