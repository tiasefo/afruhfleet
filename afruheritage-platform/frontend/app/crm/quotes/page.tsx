'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { useTranslation } from '@/hooks/useTranslation'
import { crmAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  FileText, 
  DollarSign, 
  Send, 
  Eye,
  Loader2,
  ArrowRight,
  Calendar
} from 'lucide-react'

const quoteStatuses = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-800' },
  { value: 'viewed', label: 'Viewed', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'expired', label: 'Expired', color: 'bg-orange-100 text-orange-800' },
]

export default function QuotesPage() {
  const { user } = useAuth()
  const { branding } = useBranding()
  const { t } = useTranslation()
  
  const [quotes, setQuotes] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    quote_number: '',
    currency: 'GHS',
    total_amount: '',
    opportunity_id: '',
  })

  useEffect(() => {
    loadQuotesData()
  }, [])

  const loadQuotesData = async () => {
    setIsLoading(true)
    try {
      const [quotesData, opportunitiesData] = await Promise.all([
        crmAPI.getQuotes(),
        crmAPI.getOpportunities(),
      ])
      
      setQuotes(quotesData || [])
      setOpportunities(opportunitiesData || [])
    } catch (error) {
      console.error('Failed to load quotes data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateQuote = async () => {
    if (!formData.quote_number || !formData.total_amount) return
    
    setIsProcessing(true)
    try {
      const payload = {
        quote_number: formData.quote_number,
        currency: formData.currency,
        total_amount: parseFloat(formData.total_amount),
        opportunity_id: formData.opportunity_id || undefined,
      }
      
      await crmAPI.createQuote(payload)
      await loadQuotesData()
      setShowCreateModal(false)
      setFormData({
        quote_number: '',
        currency: 'GHS',
        total_amount: '',
        opportunity_id: '',
      })
    } catch (error) {
      console.error('Failed to create quote:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusInfo = (status: string) => {
    return quoteStatuses.find(s => s.value === status) || quoteStatuses[0]
  }

  const generateQuoteNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `Q-${year}${month}-${random}`
  }

  const totalValue = quotes.reduce((sum, quote) => sum + (quote.total_amount || 0), 0)
  const activeQuotes = quotes.filter(quote => ['draft', 'sent', 'viewed'].includes(quote.status))
  const wonQuotes = quotes.filter(quote => quote.status === 'accepted')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quotes Management</h1>
              <p className="mt-2 text-sm text-gray-600">Create and manage customer quotes</p>
            </div>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Quote
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Quote</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Quote Number</label>
                    <div className="flex space-x-2">
                      <Input
                        value={formData.quote_number}
                        onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                        placeholder="Q-202412-001"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setFormData({ ...formData, quote_number: generateQuoteNumber() })}
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Currency</label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
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
                      <label className="text-sm font-medium">Total Amount</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.total_amount}
                        onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Opportunity (Optional)</label>
                    <Select value={formData.opportunity_id} onValueChange={(value) => setFormData({ ...formData, opportunity_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select opportunity" />
                      </SelectTrigger>
                      <SelectContent>
                        {opportunities.map((opportunity) => (
                          <SelectItem key={opportunity.id} value={opportunity.id}>
                            {opportunity.title} - {opportunity.currency} {opportunity.estimated_value?.toLocaleString() || 'N/A'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button onClick={handleCreateQuote} disabled={!formData.quote_number || !formData.total_amount || isProcessing}>
                      {isProcessing ? 'Creating...' : 'Create Quote'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Quotes</p>
                  <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Send className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Quotes</p>
                  <p className="text-2xl font-bold text-gray-900">{activeQuotes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
                  <p className="text-2xl font-bold text-gray-900">GHS {totalValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Won Quotes</p>
                  <p className="text-2xl font-bold text-gray-900">{wonQuotes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quotes List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            {quotes.length > 0 ? (
              <div className="space-y-4">
                {quotes.map((quote) => {
                  const statusInfo = getStatusInfo(quote.status)
                  return (
                    <div key={quote.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900">{quote.quote_number}</h3>
                            <Badge className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                            <span>Amount: {quote.currency} {quote.total_amount.toLocaleString()}</span>
                            <span>Created: {new Date(quote.created_at || Date.now()).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Send className="w-4 h-4 mr-2" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No quotes yet</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Get started by creating your first quote
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quote
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
