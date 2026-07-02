'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { publicStorefrontApi, brandingAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ShoppingBag,
  Search,
  Loader2,
  ImagePlus,
  Phone,
  Mail,
  MapPin,
  Package,
  Truck,
  MessageCircle,
  CheckCircle,
} from 'lucide-react'
import { FAQChatWidget } from '@/components/faq-chat-widget'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function PublicStorefrontPage() {
  const { slug } = useParams() as { slug: string }
  const [products, setProducts] = useState<any[]>([])
  const [branding, setBranding] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterFeatured, setFilterFeatured] = useState(false)

  // Tracking widget state
  const [trackNum, setTrackNum] = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackResult, setTrackResult] = useState<any>(null)
  const [trackError, setTrackError] = useState('')

  // Support ticket state
  const [ticketName, setTicketName] = useState('')
  const [ticketEmail, setTicketEmail] = useState('')
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketDescription, setTicketDescription] = useState('')
  const [ticketCategory, setTicketCategory] = useState('general')
  const [ticketPriority, setTicketPriority] = useState('medium')
  const [ticketLoading, setTicketLoading] = useState(false)
  const [ticketSuccess, setTicketSuccess] = useState('')
  const [ticketError, setTicketError] = useState('')

  useEffect(() => {
    if (!slug) return
    loadStorefront()
  }, [slug])

  const loadStorefront = async () => {
    setIsLoading(true)
    try {
      const [prodData, brandData] = await Promise.all([
        publicStorefrontApi.products(slug, { featured_only: false }),
        brandingAPI.getPublic().catch(() => null),
      ])
      setProducts(Array.isArray(prodData) ? prodData : [])
      if (brandData) setBranding(brandData)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketName.trim() || !ticketEmail.trim() || !ticketSubject.trim() || !ticketDescription.trim()) return
    setTicketLoading(true)
    setTicketError('')
    setTicketSuccess('')
    try {
      const res = await fetch('/api/v1/support-crm/public/tickets?tenant_id=' + encodeURIComponent(slug), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: slug,
          public_submitter_name: ticketName.trim(),
          public_submitter_email: ticketEmail.trim(),
          subject: ticketSubject.trim(),
          description: ticketDescription.trim(),
          category: ticketCategory,
          priority: ticketPriority,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setTicketSuccess(`Ticket created successfully! Your ticket reference: ${data.public_token}`)
        setTicketName('')
        setTicketEmail('')
        setTicketSubject('')
        setTicketDescription('')
        setTicketCategory('general')
        setTicketPriority('medium')
      } else {
        const err = await res.json().catch(() => ({ detail: 'Failed to create ticket' }))
        setTicketError(err.detail || 'Failed to create ticket. Please try again.')
      }
    } catch {
      setTicketError('Network error. Please try again.')
    } finally {
      setTicketLoading(false)
    }
  }

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackNum.trim()) return
    setTrackLoading(true)
    setTrackError('')
    setTrackResult(null)
    try {
      const res = await fetch(`/api/v1/shipments/public/track/${slug}/${encodeURIComponent(trackNum.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setTrackResult(data)
      } else if (res.status === 404) {
        setTrackError('Shipment not found. Please check your tracking number.')
      } else {
        setTrackError('Unable to track shipment. Please try again later.')
      }
    } catch {
      setTrackError('Network error. Please try again.')
    } finally {
      setTrackLoading(false)
    }
  }

  const filtered = products.filter((p) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.tags?.toLowerCase().includes(q)
    )
  }).filter((p) => (!filterFeatured || p.is_featured))

  const featured = products.filter((p) => p.is_featured)

  const primaryColor = branding?.primary_color || '#1A73E8'
  const accentColor = branding?.accent_color || '#34A853'
  const companyName = branding?.company_name || slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <header className="border-b" style={{ borderColor: `${primaryColor}20` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt={companyName} className="h-10 w-auto" />
              ) : (
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: primaryColor }}>
                  {companyName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{companyName}</h1>
                <p className="text-xs text-gray-500">Powered by Afruheritage</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {branding?.support_phone && (
                <a href={`tel:${branding.support_phone}`} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                  <Phone className="h-4 w-4" /> {branding.support_phone}
                </a>
              )}
              {branding?.support_email && (
                <a href={`mailto:${branding.support_email}`} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                  <Mail className="h-4 w-4" /> {branding.support_email}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Track Shipment Widget */}
      <div className="bg-gradient-to-r from-slate-50 to-white border-b py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Truck className="h-5 w-5" style={{ color: primaryColor }} />
              <h2 className="text-lg font-semibold text-gray-800">Track Your Shipment</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Enter your tracking number to see real-time status and location updates.</p>
            <form onSubmit={handleTrack} className="flex gap-2">
              <Input
                placeholder="Tracking number (e.g. AFR-2024-12847)"
                value={trackNum}
                onChange={(e) => setTrackNum(e.target.value)}
                className="flex-1 h-11"
              />
              <Button type="submit" disabled={trackLoading || !trackNum.trim()} className="h-11 px-6" style={{ backgroundColor: primaryColor }}>
                {trackLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Track'}
              </Button>
            </form>
            {trackError && (
              <p className="mt-3 text-sm text-red-600">{trackError}</p>
            )}
            {trackResult && (
              <Card className="mt-4 text-left">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-gray-500">Tracking Number</p>
                      <p className="font-semibold">{trackResult.tracking_number}</p>
                    </div>
                    <Badge style={{ backgroundColor: accentColor }} className="text-white">{trackResult.status?.replace(/_/g, ' ') || 'In Transit'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <p className="text-gray-500 text-xs">From</p>
                      <p>{trackResult.origin_city}, {trackResult.origin_country}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">To</p>
                      <p>{trackResult.destination_city}, {trackResult.destination_country}</p>
                    </div>
                  </div>
                  {trackResult.current_latitude && trackResult.current_longitude && (
                    <div className="mt-3 p-2 rounded bg-blue-50 text-sm">
                      <p className="text-blue-700 font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> Live GPS</p>
                      <p className="text-blue-600 text-xs">{trackResult.current_latitude?.toFixed(5)}, {trackResult.current_longitude?.toFixed(5)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Support Ticket Widget */}
      <div className="bg-gradient-to-r from-slate-50 to-white border-b py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MessageCircle className="h-5 w-5" style={{ color: primaryColor }} />
                <h2 className="text-lg font-semibold text-gray-800">Need Help? Contact Support</h2>
              </div>
              <p className="text-sm text-gray-500">Submit a support ticket and our team will get back to you shortly.</p>
            </div>
            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Your Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Email</Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={ticketEmail}
                    onChange={(e) => setTicketEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Subject</Label>
                <Input
                  placeholder="What is your inquiry about?"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Category</Label>
                  <Select value={ticketCategory} onValueChange={setTicketCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="delivery">Delivery Issue</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Priority</Label>
                  <Select value={ticketPriority} onValueChange={setTicketPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Description</Label>
                <Textarea
                  placeholder="Please describe your issue or inquiry in detail..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={ticketLoading}
                className="w-full"
                style={{ backgroundColor: primaryColor }}
              >
                {ticketLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Support Ticket'}
              </Button>
              {ticketError && (
                <p className="text-sm text-red-600 text-center">{ticketError}</p>
              )}
              {ticketSuccess && (
                <div className="p-3 rounded bg-green-50 text-sm text-green-700 text-center flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" /> {ticketSuccess}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Featured Hero */}
      {featured.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-white border-b py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 3).map((p) => (
                <Card key={p.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                    {p.images?.length > 0 ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus className="h-10 w-10 text-gray-300" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg">{p.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{p.short_description || p.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-lg" style={{ color: primaryColor }}>GHS {p.price}</span>
                      <Badge className="text-white" style={{ backgroundColor: accentColor }}>Featured</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-8">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterFeatured ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterFeatured(!filterFeatured)}
            >
              Featured Only
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">
              {search ? 'No products match your search' : 'No products available yet'}
            </h3>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <Card key={p.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {p.images?.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlus className="h-10 w-10 text-gray-300" />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{p.short_description || p.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold" style={{ color: primaryColor }}>GHS {p.price}</span>
                    {!p.is_available && <Badge variant="secondary">Out of stock</Badge>}
                  </div>
                  {p.stock_quantity > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{p.stock_quantity} in stock</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <p className="mt-1">Powered by <a href="https://afruheritage.com" className="underline">Afruheritage</a></p>
        </div>
      </footer>

      {/* AI Chat Widget */}
      <FAQChatWidget />
    </div>
  )
}
