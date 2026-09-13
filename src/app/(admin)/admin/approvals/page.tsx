'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Eye } from 'lucide-react'
import Link from 'next/link'
import { useQuotations } from '@/context/quotation-context'
import { useNotifications } from '@/context/notification-context'

export default function ApprovalsPage() {
  const { quotations, updateStatus } = useQuotations()
  const { addNotification } = useNotifications()

  // Show only Pending Approval quotations
  const pendingApprovals = quotations.filter(q => q.status === 'Pending Approval')

  const handleAction = (id: string, action: 'Admin Accepted' | 'Rejected') => {
    updateStatus(id, action)
    const targetQ = quotations.find(q => q.id === id)

    if (action === 'Admin Accepted') {
      addNotification({
        type: 'quotation_approved',
        targetRole: 'salesperson',
        title: 'Quotation Approved',
        message: `Admin approved quotation ${id} for ${targetQ?.customerName || 'Customer'} (Discount: ${targetQ?.discount || 0}%).`,
        quotationId: id,
        customerName: targetQ?.customerName,
        salespersonName: targetQ?.salesperson,
        link: '/quotations',
      })
    } else {
      addNotification({
        type: 'quotation_rejected',
        targetRole: 'salesperson',
        title: 'Quotation Rejected',
        message: `Admin rejected quotation ${id} for ${targetQ?.customerName || 'Customer'}.`,
        quotationId: id,
        customerName: targetQ?.customerName,
        salespersonName: targetQ?.salesperson,
        link: '/quotations',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Discount Approvals</h2>
          <p className="text-muted-foreground">Review quotations with a discount above 25% that require your approval.</p>
        </div>
        <Link href="/admin/approvals/approved">
          <Button variant="outline" className="bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 shadow-sm font-semibold">
            <Check className="w-4 h-4 mr-2" /> Approved Quotations
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {pendingApprovals.length > 0 ? (
          pendingApprovals.map(approval => (
            <Card key={approval.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{approval.id}</CardTitle>
                  <CardDescription>Requested by {approval.salesperson}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-muted-foreground">Total: SAR {approval.grandTotal.toFixed(2)}</div>
                  <div className="text-sm font-bold text-red-600 dark:text-red-400">Discount: {approval.discount}%</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Customer: <span className="font-medium text-foreground">{approval.customerName}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/quotations/${approval.id}`}>
                      <Button variant="outline" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                    </Link>
                    <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleAction(approval.id, 'Rejected')}>
                      Reject
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAction(approval.id, 'Admin Accepted')}>
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No pending discount approvals.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
