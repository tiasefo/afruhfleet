'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { BackButton } from '@/components/back-button'
import {
  CreditCard,
  Search,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Edit,
  ArrowLeftRight,
  Ban,
  Plus,
} from 'lucide-react'

interface Payment {
  id: string
  tenant_id: string
  tenant_name?: string
  amount: number
  currency: string
  status: string
  method: string
  reference?: string
  description?: string
  created_at: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)

  const [manualForm, setManualForm] = useState({ tenant_id: '', amount: '', currency: 'GHS', method: 'manual', reference: '', description: '' })
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '', refund_to: 'original' })
  const [disputeForm, setDisputeForm] = useState({ status: '', resolution_notes: '', refund_amount: '' })

  const loadPayments = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      if (tenantFilter) params.tenant_id = tenantFilter
      if (searchQuery) params.q = searchQuery

      const response = await api.get('/admin/payments', { params })
      setPayments(response.items || response)
    } catch (error) {
      toast.error('Failed to load payments')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [statusFilter, tenantFilter])

  const handleManualPayment = async () => {
    try {
      await api.post('/admin/payments/manual', {
        ...manualForm,
        amount: parseFloat(manualForm.amount),
      })
      toast.success('Manual payment created successfully')
      setManualDialogOpen(false)
      setManualForm({ tenant_id: '', amount: '', currency: 'GHS', method: 'manual', reference: '', description: '' })
      loadPayments()
    } catch (error) {
      toast.error('Failed to create manual payment')
    }
  }

  const handleRefund = async () => {
    if (!selectedPayment) return
    try {
      await api.post(`/admin/payments/${selectedPayment.id}/refund`, {
        ...refundForm,
        amount: refundForm.amount ? parseFloat(refundForm.amount) : undefined,
      })
      toast.success('Refund processed successfully')
      setRefundDialogOpen(false)
      loadPayments()
    } catch (error) {
      toast.error('Failed to process refund')
    }
  }

  const handleDispute = async () => {
    if (!selectedPayment) return
    try {
      await api.post(`/admin/payments/${selectedPayment.id}/dispute`, {
        ...disputeForm,
        refund_amount: disputeForm.refund_amount ? parseFloat(disputeForm.refund_amount) : undefined,
      })
      toast.success('Dispute handled successfully')
      setDisputeDialogOpen(false)
      loadPayments()
    } catch (error) {
      toast.error('Failed to handle dispute')
    }
  }

  const handleCheckStatus = async () => {
    if (!selectedPayment) return
    try {
      const status = await api.get(`/admin/payments/${selectedPayment.id}/status`)
      toast.success(`Payment status: ${status.status}`)
    } catch (error) {
      toast.error('Failed to check payment status')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      refunded: { color: 'bg-blue-100 text-blue-800', icon: ArrowLeftRight },
      disputed: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    }
    const config = statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: FileText }
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold">Payment Operations</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setManualDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Manual Payment
          </Button>
          <Button onClick={loadPayments} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label>Tenant</Label>
              <Input
                placeholder="Tenant ID"
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No payments found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedPayment(payment)}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{payment.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap">{payment.tenant_name || payment.tenant_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        {payment.amount.toFixed(2)} {payment.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{payment.method}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{payment.reference || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleCheckStatus(); }}>
                            <Search className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setRefundDialogOpen(true); }} disabled={payment.status !== 'completed'}>
                            <ArrowLeftRight className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDisputeDialogOpen(true); }}>
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Payment Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Manual Payment</DialogTitle>
            <DialogDescription>Record a manual payment for a tenant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tenant ID</Label>
              <Input
                value={manualForm.tenant_id}
                onChange={(e) => setManualForm({ ...manualForm, tenant_id: e.target.value })}
                placeholder="Enter tenant ID"
              />
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={manualForm.amount}
                onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={manualForm.currency} onValueChange={(v) => setManualForm({ ...manualForm, currency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GHS">GHS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference</Label>
              <Input
                value={manualForm.reference}
                onChange={(e) => setManualForm({ ...manualForm, reference: e.target.value })}
                placeholder="Payment reference"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={manualForm.description}
                onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                placeholder="Payment description..."
              />
            </div>
            <Button onClick={handleManualPayment} className="w-full">Create Payment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>Refund payment to original source</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Refund Amount (leave empty for full refund)</Label>
              <Input
                type="number"
                step="0.01"
                value={refundForm.amount}
                onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={refundForm.reason}
                onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                placeholder="Explain refund reason..."
              />
            </div>
            <Button onClick={handleRefund} className="w-full">Process Refund</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Handle Dispute</DialogTitle>
            <DialogDescription>Resolve payment dispute</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={disputeForm.status} onValueChange={(v) => setDisputeForm({ ...disputeForm, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="investigating">Under Investigation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Refund Amount (if applicable)</Label>
              <Input
                type="number"
                step="0.01"
                value={disputeForm.refund_amount}
                onChange={(e) => setDisputeForm({ ...disputeForm, refund_amount: e.target.value })}
                placeholder="Enter refund amount"
              />
            </div>
            <div>
              <Label>Resolution Notes</Label>
              <Textarea
                value={disputeForm.resolution_notes}
                onChange={(e) => setDisputeForm({ ...disputeForm, resolution_notes: e.target.value })}
                placeholder="Add resolution notes..."
              />
            </div>
            <Button onClick={handleDispute} className="w-full">Update Dispute</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
