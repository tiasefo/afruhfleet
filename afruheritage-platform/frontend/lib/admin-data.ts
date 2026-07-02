import type { LucideIcon } from "lucide-react"
import { Truck, Bus, Bike, CarTaxiFront } from "lucide-react"

export type VendorStatus = "pending" | "active" | "suspended"

export type AdminVendor = {
  id: string
  name: string
  type: string
  Icon: LucideIcon
  rating: number
  trips: number
  region: string
  status: VendorStatus
  verified: boolean
  documents: number
  joined: string
}

export const adminVendors: AdminVendor[] = [
  { id: "vnd_001", name: "Kwame Logistics", type: "Box Truck · 7.5t", Icon: Truck, rating: 4.9, trips: 312, region: "Greater Accra", status: "active", verified: true, documents: 4, joined: "2025-11-02" },
  { id: "vnd_002", name: "Northern Coaches", type: "City Coach · 40 seats", Icon: Bus, rating: 4.8, trips: 187, region: "Kumasi", status: "active", verified: true, documents: 5, joined: "2025-12-14" },
  { id: "vnd_003", name: "Esi Express", type: "Delivery Bike · 80kg", Icon: Bike, rating: 5.0, trips: 96, region: "Tema", status: "pending", verified: false, documents: 2, joined: "2026-06-21" },
  { id: "vnd_004", name: "Yaw Rides", type: "Ride-hail Sedan · 4 seats", Icon: CarTaxiFront, rating: 4.7, trips: 540, region: "Greater Accra", status: "pending", verified: false, documents: 3, joined: "2026-06-25" },
  { id: "vnd_005", name: "Volta Freight Co.", type: "Semi-Trailer · 40t", Icon: Truck, rating: 4.6, trips: 218, region: "Ho", status: "suspended", verified: true, documents: 4, joined: "2025-09-30" },
  { id: "vnd_006", name: "Cape Coast Movers", type: "Cargo Van · 3.5t", Icon: Truck, rating: 4.8, trips: 274, region: "Cape Coast", status: "active", verified: true, documents: 5, joined: "2026-01-18" },
]

export type AdminReview = {
  id: string
  vendor: string
  author: string
  rating: number
  comment: string
  flagged: boolean
  created: string
}

export const adminReviews: AdminReview[] = [
  { id: "rev_8841", vendor: "Kwame Logistics", author: "Ama M.", rating: 5, comment: "Fast delivery, driver was professional and careful with my furniture.", flagged: false, created: "2026-06-26 14:22" },
  { id: "rev_8842", vendor: "Yaw Rides", author: "Kofi B.", rating: 1, comment: "Buy cheap followers and reviews at spam-link dot biz!!!", flagged: true, created: "2026-06-27 09:05" },
  { id: "rev_8843", vendor: "Esi Express", author: "Akua D.", rating: 4, comment: "Good service overall, slightly late but kept me updated.", flagged: false, created: "2026-06-27 11:40" },
  { id: "rev_8844", vendor: "Volta Freight Co.", author: "Anon", rating: 2, comment: "This driver is a [redacted profanity] and should be banned.", flagged: true, created: "2026-06-28 08:15" },
]

export type DeliveryLog = {
  id: string
  tracking: string
  vendor: string
  status: "in_transit" | "delivered" | "picked_up" | "cancelled"
  lat: number
  lng: number
  speed: number
  heading: number
  distanceToDropoff: number
  timestamp: string
}

export const deliveryLogs: DeliveryLog[] = [
  { id: "gps_50231", tracking: "AFR-2026-004182", vendor: "Kwame Logistics", status: "in_transit", lat: 5.6712, lng: -0.0421, speed: 52, heading: 41, distanceToDropoff: 184.2, timestamp: "2026-06-29 10:14:02" },
  { id: "gps_50232", tracking: "AFR-2026-004182", vendor: "Kwame Logistics", status: "in_transit", lat: 5.8033, lng: -0.2210, speed: 61, heading: 38, distanceToDropoff: 171.6, timestamp: "2026-06-29 10:31:48" },
  { id: "gps_50233", tracking: "AFR-2026-004177", vendor: "Esi Express", status: "picked_up", lat: 5.6498, lng: -0.0166, speed: 0, heading: 0, distanceToDropoff: 12.4, timestamp: "2026-06-29 10:33:10" },
  { id: "gps_50234", tracking: "AFR-2026-004155", vendor: "Northern Coaches", status: "delivered", lat: 6.6885, lng: -1.6244, speed: 0, heading: 0, distanceToDropoff: 0, timestamp: "2026-06-29 09:58:21" },
  { id: "gps_50235", tracking: "AFR-2026-004190", vendor: "Cape Coast Movers", status: "in_transit", lat: 5.3411, lng: -1.0238, speed: 44, heading: 270, distanceToDropoff: 96.8, timestamp: "2026-06-29 10:40:55" },
]

export type AdminJob = {
  id: string
  tracking: string
  tenant: string
  driver: string | null
  status: "open" | "assigned" | "completed" | "cancelled"
  price: number
  route: string
  created: string
}

export const adminJobs: AdminJob[] = [
  { id: "job_3301", tracking: "AFR-2026-004182", tenant: "Acme Imports", driver: "Kwame Logistics", status: "assigned", price: 620, route: "Accra → Kumasi", created: "2026-06-29 08:02" },
  { id: "job_3302", tracking: "AFR-2026-004177", tenant: "Bright Retail", driver: "Esi Express", status: "assigned", price: 85, route: "Accra → Tema", created: "2026-06-29 08:40" },
  { id: "job_3303", tracking: "AFR-2026-004191", tenant: "Acme Imports", driver: null, status: "open", price: 410, route: "Takoradi → Accra", created: "2026-06-29 09:12" },
  { id: "job_3304", tracking: "AFR-2026-004155", tenant: "Volta Traders", driver: "Northern Coaches", status: "completed", price: 240, route: "Accra → Ho", created: "2026-06-28 16:30" },
]

export type FeatureFlag = {
  key: string
  label: string
  description: string
  enabled: boolean
}

export const featureFlags: FeatureFlag[] = [
  { key: "marketplace_basic", label: "Marketplace posting", description: "Allow tenants to post shipments to the marketplace.", enabled: true },
  { key: "marketplace_gps", label: "GPS tracking", description: "Enable real-time GPS tracking on deliveries.", enabled: true },
  { key: "marketplace_gps_ping", label: "GPS ping billing", description: "Deduct credits per GPS ping recorded.", enabled: false },
]

/* ---------------- CRM (SuiteCRM-inspired) ---------------- */

export type CrmStage = "lead" | "prospect" | "customer" | "churned"

export type CrmActivity = { id: string; type: "call" | "email" | "meeting" | "note"; summary: string; at: string }

export type CrmCustomer = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  owner: string
  stage: CrmStage
  value: number
  health: number
  tags: string[]
  lastActivity: string
  activities: CrmActivity[]
}

export const crmOwners = ["Adwoa Owusu", "Kojo Asante", "Nana Addo", "Unassigned"]

export const crmCustomers: CrmCustomer[] = [
  {
    id: "cus_1001", name: "Ama Mensah", company: "Acme Imports", email: "ama@acme.co", phone: "+233 555 0101",
    owner: "Adwoa Owusu", stage: "customer", value: 48000, health: 92, tags: ["enterprise", "freight"], lastActivity: "2026-06-28",
    activities: [
      { id: "act_1", type: "call", summary: "Quarterly review — happy with on-time rate", at: "2026-06-28 11:00" },
      { id: "act_2", type: "email", summary: "Sent renewal quote for Growth plan", at: "2026-06-20 09:14" },
    ],
  },
  {
    id: "cus_1002", name: "Bright Osei", company: "Bright Retail", email: "bright@brightretail.gh", phone: "+233 555 0102",
    owner: "Kojo Asante", stage: "prospect", value: 12500, health: 64, tags: ["ecommerce"], lastActivity: "2026-06-27",
    activities: [{ id: "act_3", type: "meeting", summary: "Demo of marketplace booking flow", at: "2026-06-27 15:30" }],
  },
  {
    id: "cus_1003", name: "Kofi Boateng", company: "Volta Traders", email: "kofi@voltatraders.com", phone: "+233 555 0103",
    owner: "Nana Addo", stage: "customer", value: 31000, health: 78, tags: ["wholesale", "freight"], lastActivity: "2026-06-25",
    activities: [{ id: "act_4", type: "note", summary: "Interested in API access for ERP", at: "2026-06-25 10:05" }],
  },
  {
    id: "cus_1004", name: "Akua Darko", company: "Darko Logistics", email: "akua@darkolog.com", phone: "+233 555 0104",
    owner: "Unassigned", stage: "lead", value: 0, health: 40, tags: ["inbound"], lastActivity: "2026-06-29",
    activities: [{ id: "act_5", type: "email", summary: "Filled out 'Get Started' form", at: "2026-06-29 08:42" }],
  },
  {
    id: "cus_1005", name: "Yaw Antwi", company: "Antwi Movers", email: "yaw@antwimovers.gh", phone: "+233 555 0105",
    owner: "Adwoa Owusu", stage: "churned", value: 9000, health: 18, tags: ["at-risk"], lastActivity: "2026-05-30",
    activities: [{ id: "act_6", type: "call", summary: "Cited pricing concerns; cancelled", at: "2026-05-30 13:20" }],
  },
]

/* ---------------- Subscription billing (KillBill-inspired) ---------------- */

export type BillingPlan = { id: string; name: string; price: number; interval: "month" | "year"; features: string[]; popular?: boolean }

export const billingPlans: BillingPlan[] = [
  { id: "plan_starter", name: "Starter", price: 0, interval: "month", features: ["1 storefront", "50 shipments/mo", "Email support"] },
  { id: "plan_growth", name: "Growth", price: 499, interval: "month", popular: true, features: ["5 storefronts", "Unlimited shipments", "GPS tracking", "Priority support"] },
  { id: "plan_enterprise", name: "Enterprise", price: 1999, interval: "month", features: ["Unlimited storefronts", "API access", "Dedicated manager", "SLA 99.9%"] },
]

export type SubStatus = "trialing" | "active" | "past_due" | "paused" | "cancelled"

export type Subscription = {
  id: string
  customer: string
  company: string
  plan: string
  status: SubStatus
  mrr: number
  seats: number
  started: string
  nextInvoice: string
}

export const subscriptions: Subscription[] = [
  { id: "sub_2001", customer: "Ama Mensah", company: "Acme Imports", plan: "Enterprise", status: "active", mrr: 1999, seats: 24, started: "2025-11-02", nextInvoice: "2026-07-02" },
  { id: "sub_2002", customer: "Bright Osei", company: "Bright Retail", plan: "Growth", status: "trialing", mrr: 0, seats: 5, started: "2026-06-15", nextInvoice: "2026-06-29" },
  { id: "sub_2003", customer: "Kofi Boateng", company: "Volta Traders", plan: "Growth", status: "active", mrr: 499, seats: 8, started: "2026-01-18", nextInvoice: "2026-07-18" },
  { id: "sub_2004", customer: "Yaw Antwi", company: "Antwi Movers", plan: "Starter", status: "past_due", mrr: 499, seats: 3, started: "2025-09-30", nextInvoice: "2026-06-15" },
]

export type InvoiceStatus = "paid" | "open" | "overdue" | "void"

export type Invoice = {
  id: string
  customer: string
  amount: number
  status: InvoiceStatus
  issued: string
  due: string
}

export const invoices: Invoice[] = [
  { id: "inv_9001", customer: "Acme Imports", amount: 1999, status: "paid", issued: "2026-06-02", due: "2026-06-09" },
  { id: "inv_9002", customer: "Volta Traders", amount: 499, status: "open", issued: "2026-06-18", due: "2026-06-25" },
  { id: "inv_9003", customer: "Antwi Movers", amount: 499, status: "overdue", issued: "2026-05-15", due: "2026-05-22" },
  { id: "inv_9004", customer: "Bright Retail", amount: 0, status: "open", issued: "2026-06-15", due: "2026-06-29" },
]

/** Maps each admin action to the backend endpoint it should call. */
export const endpointMap = {
  approveVendor: { method: "POST", path: "/api/v1/vendors/admin/{vendor_id}/review", body: '{ "decision": "approved" }' },
  rejectVendor: { method: "POST", path: "/api/v1/vendors/admin/{vendor_id}/review", body: '{ "decision": "rejected" }' },
  suspendVendor: { method: "POST", path: "/api/v1/vendors/admin/{vendor_id}/suspend", body: '{ "reason": "string" }' },
  reinstateVendor: { method: "POST", path: "/api/v1/vendors/admin/{vendor_id}/review", body: '{ "decision": "approved" }' },
  deleteVendor: { method: "DELETE", path: "/api/v1/vendors/admin/{vendor_id}", body: null },
  cancelJob: { method: "POST", path: "/api/v1/admin/marketplace/jobs/{job_id}/cancel", body: null },
  reassignJob: { method: "POST", path: "/api/v1/admin/marketplace/jobs/{job_id}/reassign/{driver_id}", body: null },
  getEligibleDrivers: { method: "GET", path: "/api/v1/admin/marketplace/jobs/{job_id}/eligible-drivers", body: null },
  exportGps: { method: "GET", path: "/api/v1/marketplace/shipments/{job_id}/gps", body: null },
  toggleFlag: { method: "PATCH", path: "/api/v1/admin/features/{flag_key}", body: '{ "enabled": boolean }' },
  deleteReview: { method: "DELETE", path: "/api/v1/marketplace/reviews/{review_id}", body: null },
  convertLead: { method: "POST", path: "/api/v1/crm/customers/{customer_id}/convert", body: '{ "stage": "prospect" }' },
  updateStage: { method: "PATCH", path: "/api/v1/crm/customers/{customer_id}/stage", body: '{ "stage": "string" }' },
  assignOwner: { method: "PATCH", path: "/api/v1/crm/customers/{customer_id}/owner", body: '{ "owner": "string" }' },
  logActivity: { method: "POST", path: "/api/v1/crm/customers/{customer_id}/activities", body: '{ "type": "string", "summary": "string" }' },
  deleteCustomer: { method: "DELETE", path: "/api/v1/crm/customers/{customer_id}", body: null },
  changePlan: { method: "PATCH", path: "/api/v1/billing/subscriptions/{subscription_id}/plan", body: '{ "plan_id": "string" }' },
  pauseSubscription: { method: "POST", path: "/api/v1/billing/subscriptions/{subscription_id}/pause", body: null },
  resumeSubscription: { method: "POST", path: "/api/v1/billing/subscriptions/{subscription_id}/resume", body: null },
  cancelSubscription: { method: "POST", path: "/api/v1/billing/subscriptions/{subscription_id}/cancel", body: '{ "reason": "string" }' },
  voidInvoice: { method: "POST", path: "/api/v1/billing/invoices/{invoice_id}/void", body: null },
  markInvoicePaid: { method: "POST", path: "/api/v1/billing/invoices/{invoice_id}/payments", body: '{ "method": "manual" }' },
} as const

export type EndpointKey = keyof typeof endpointMap
