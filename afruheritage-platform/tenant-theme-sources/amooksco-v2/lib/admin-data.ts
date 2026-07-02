// Mock data for the AMOOKSCO staff console (demo).
// In production these would be loaded from the AfruHeritage backend APIs.

export type StaffRole =
  | "tenant_owner"
  | "tenant_admin"
  | "warehouse_manager"
  | "cargo_operator"
  | "customer_support"
  | "billing_viewer"
  | "storefront_editor"

export const roleLabels: Record<StaffRole, string> = {
  tenant_owner: "Tenant Owner",
  tenant_admin: "Tenant Admin",
  warehouse_manager: "Warehouse Manager",
  cargo_operator: "Cargo Operator",
  customer_support: "Customer Support",
  billing_viewer: "Billing Viewer",
  storefront_editor: "Storefront Editor",
}

export type Staff = {
  id: string
  name: string
  email: string
  role: StaffRole
  status: "active" | "invited" | "suspended"
}

export const staff: Staff[] = [
  { id: "u1", name: "Michael Amoakoh", email: "admin@amooksco.com", role: "tenant_owner", status: "active" },
  { id: "u2", name: "Priscilla", email: "priscilla@amooksco.com", role: "customer_support", status: "active" },
  { id: "u3", name: "Mimi", email: "mimi@amooksco.com", role: "billing_viewer", status: "active" },
  { id: "u4", name: "Linda", email: "linda@amooksco.com", role: "billing_viewer", status: "active" },
  { id: "u5", name: "Solo", email: "solo@amooksco.com", role: "billing_viewer", status: "active" },
  { id: "u6", name: "Kwame Boateng", email: "warehouse@amooksco.com", role: "warehouse_manager", status: "active" },
  { id: "u7", name: "Akosua Mensah", email: "cargo@amooksco.com", role: "cargo_operator", status: "invited" },
]

export type Member = {
  id: string
  name: string
  phone: string
  mark: string
  type: "member" | "admin"
  goods: string
  joined: string
}

export const members: Member[] = [
  { id: "m1", name: "Agyirigo Enterprise", phone: "+233 24 111 2233", mark: "AGYIRIGO", type: "member", goods: "Phone accessories", joined: "2025-09-02" },
  { id: "m2", name: "Yaa Rahman", phone: "+233 20 445 6677", mark: "YAARAHMAN", type: "member", goods: "Textiles & fabrics", joined: "2025-09-10" },
  { id: "m3", name: "Faye Menkoa", phone: "+233 55 998 1122", mark: "FAYEMK", type: "member", goods: "Cosmetics", joined: "2025-09-15" },
  { id: "m4", name: "Kojo Asante", phone: "+233 27 332 8890", mark: "KASANTE", type: "member", goods: "Auto parts", joined: "2025-10-01" },
  { id: "m5", name: "Ama Serwaa", phone: "+233 24 776 5510", mark: "ASERWAA", type: "member", goods: "Kitchenware", joined: "2025-10-05" },
  { id: "m6", name: "Beacon Imports", phone: "+233 30 224 4411", mark: "BEACON", type: "admin", goods: "Electronics (bulk)", joined: "2025-08-20" },
  { id: "m7", name: "Amooksco Customer 0418", phone: "+233 55 120 9087", mark: "AMK0418", type: "member", goods: "Mixed goods", joined: "2025-10-12" },
  { id: "m8", name: "Nana Adwoa", phone: "+233 26 778 1290", mark: "NADWOA", type: "member", goods: "Shoes & bags", joined: "2025-10-18" },
]

export const cargo = [
  { ref: "AFR-AMO-04A3302D82", mark: "AGYIRIGO", mode: "Sea", cbm: "1.20", status: "In Transit", eta: "6 days" },
  { ref: "AFR-AMO-77B1290C44", mark: "YAARAHMAN", mode: "Sea", cbm: "0.85", status: "At China WH", eta: "TBD" },
  { ref: "AFR-AMO-12C9981A30", mark: "FAYEMK", mode: "Air", cbm: "0.10", status: "Delivered", eta: "—" },
  { ref: "AFR-AMO-55D4410B19", mark: "KASANTE", mode: "Sea", cbm: "2.40", status: "Customs", eta: "2 days" },
  { ref: "AFR-AMO-90E2284F77", mark: "BEACON", mode: "Sea", cbm: "8.60", status: "In Transit", eta: "9 days" },
]

export const stats = {
  cargoRecords: 2929,
  members: 1022,
  manifestProfiles: 652,
  pendingNotices: 3,
}
