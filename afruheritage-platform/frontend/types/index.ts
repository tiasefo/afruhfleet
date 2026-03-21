// Common Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

// User & Auth Types
export interface User {
  id: string
  email: string
  full_name: string
  is_superuser?: boolean
  tenant_id?: string
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

// Shipment Types
export enum ShipmentStatus {
  DRAFT = 'draft',
  BOOKED = 'booked',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  AT_CUSTOMS = 'at_customs',
  CUSTOMS_CLEARED = 'customs_cleared',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  REFUNDED = 'refunded',
  OVERDUE = 'overdue'
}

export interface Shipment {
  id: string
  tenant_id: string
  tracking_number: string
  reference_number?: string
  cargo_type?: string
  package_count: number
  weight_kg: number
  volume_cbm?: number
  length_cm?: number
  width_cm?: number
  height_cm?: number
  description?: string
  notes?: string
  
  // Sender Info
  sender_name: string
  sender_phone?: string
  sender_address: string
  sender_city?: string
  sender_country?: string
  
  // Receiver Info
  receiver_name: string
  receiver_phone?: string
  receiver_address: string
  receiver_city?: string
  receiver_country?: string
  
  // Route & Dates
  origin_country: string
  origin_city: string
  destination_country: string
  destination_city: string
  shipped_date?: string
  estimated_arrival?: string
  actual_arrival?: string
  
  // Financial
  total_cost: number
  amount_paid: number
  balance_due: number
  currency: string
  
  // Status
  status: ShipmentStatus
  payment_status: PaymentStatus
  
  // Metadata
  created_by: string
  created_at: string
  updated_at: string
}

export interface ShipmentSearchResult {
  id: string
  tracking_number: string
  receiver_name: string
  sender_name: string
  status: string
  payment_status: string
  shipped_date?: string
  estimated_arrival?: string
  total_cost: number
  balance_due: number
  currency: string
}

export interface ShipmentEvent {
  id: string
  shipment_id: string
  event_type: string
  location?: string
  description?: string
  occurred_at?: string
  created_at: string
}

export interface ShipmentCreate {
  tracking_number: string
  reference_number?: string
  cargo_type?: string
  package_count: number
  weight_kg: number
  volume_cbm?: number
  length_cm?: number
  width_cm?: number
  height_cm?: number
  description?: string
  notes?: string
  
  sender_name: string
  sender_phone?: string
  sender_address: string
  sender_city?: string
  sender_country?: string
  
  receiver_name: string
  receiver_phone?: string
  receiver_address: string
  receiver_city?: string
  receiver_country?: string
  
  origin_country: string
  origin_city: string
  destination_country: string
  destination_city: string
  shipped_date?: string
  estimated_arrival?: string
  
  total_cost: number
  amount_paid?: number
  currency: string
  
  group_member_id?: string
}

export interface ShipmentUpdate {
  status?: ShipmentStatus
  payment_status?: PaymentStatus
  estimated_arrival?: string
  actual_arrival?: string
  notes?: string
}

// Group Member Types
export interface GroupMember {
  id: string
  tenant_id: string
  full_name: string
  email: string
  phone?: string
  company?: string
  department?: string
  role?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GroupMemberCreate {
  full_name: string
  email: string
  phone?: string
  company?: string
  department?: string
  role?: string
}

export interface GroupMemberUpdate {
  full_name?: string
  email?: string
  phone?: string
  company?: string
  department?: string
  role?: string
  is_active?: boolean
}

// Billing Types
export interface Plan {
  id: string
  name: string
  code: string
  amount: number
  currency: string
  interval: 'monthly' | 'yearly'
  features: string[]
  active: boolean
  created_at: string
}

export interface Subscription {
  id: string
  tenant_id: string
  plan_id: string
  plan_name: string
  amount: number
  currency: string
  interval: 'monthly' | 'yearly'
  status: 'active' | 'cancelled' | 'past_due'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  features: string[]
  created_at: string
  updated_at: string
}

export interface Wallet {
  id: string
  tenant_id: string
  balance: number
  currency: string
  credit_limit?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PaymentInitRequest {
  amount: number
  currency: string
  email: string
  payment_type: 'subscription' | 'wallet_topup' | 'shipment_payment'
  metadata?: Record<string, any>
}

export interface PaymentInitResponse {
  reference: string
  authorization_url: string
  access_code: string
}

export interface PaymentVerifyResponse {
  status: 'success' | 'failed'
  reference: string
  amount: number
  currency: string
  payment_type: string
  metadata?: Record<string, any>
  paid_at?: string
}

// Support Types
export interface SupportTicket {
  id: string
  public_token: string
  tenant_id?: string
  user_id?: string
  subject: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
}

export interface SupportTicketCreate {
  subject: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tenant_id?: string
  user_id?: string
}

export interface SupportTicketReply {
  message: string
  sender_type: 'user' | 'support'
  created_at: string
}

// AI Widget Types
export interface AIWidgetConfig {
  enabled: boolean
  position: 'bottom-right' | 'bottom-left'
  primary_color: string
  welcome_message: string
  placeholder: string
}

export interface ChatMessage {
  id: string
  message: string
  sender: 'user' | 'ai'
  timestamp: string
  formatting?: 'markdown' | 'plain'
}

// Tenant Branding Types
export interface TenantBranding {
  company_name: string
  logo_url: string
  favicon_url: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  default_currency: string
  default_language: 'en' | 'zh'
  supported_languages: string[]
  maps_enabled: boolean
  public_tracking_enabled: boolean
  csv_import_enabled: boolean
  group_members_enabled: boolean
  max_group_members: number
  support_email: string
  support_phone: string
  legal_footer_text: string
  legal_company_name: string
}

export interface BrandingUpdate {
  company_name?: string
  logo_url?: string
  favicon_url?: string
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  background_color?: string
  default_currency?: string
  default_language?: 'en' | 'zh'
  support_email?: string
  support_phone?: string
  legal_footer_text?: string
  legal_company_name?: string
}
