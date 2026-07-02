// Central brand + contact data for AMOOKSCO LOGISTICS.
// Sourced from the official company flyers. Kept here so the storefront,
// footer and admin all read from one place (tenant-template friendly).

export const brand = {
  name: "AMOOKSCO LOGISTICS",
  group: "Amooksco Group of Companies",
  tagline: "Your Goods Are In Trusted Hands",
  headline: "Reliable Freight Forwarding From China To Ghana",
  motto: "We deliver. You trust. We care.",
  platform: "AMOOKSCO Logistics Platform",
  platformBy: "Infotech Network & Freight Forwarding Ltd",
  logo: "/tenant-assets/amooksco/logo.png",
  storeSlug: "amooksco-logistics",
  domain: "amooksco.com",
} as const

export const whatsapp = {
  // digits only, used for wa.me links
  tracking: "233556249064",
  general: "8613236479501",
}

export const contacts = {
  tracking: {
    department: "Sea Tracking / Enquiry Department",
    staff: "Priscilla",
    phone: "+233 55 624 9064",
    whatsapp: whatsapp.tracking,
    notes: "Trackings & address (SEA only) for new customers, name corrections.",
  },
  general: {
    department: "Customer Care (China Office)",
    phone: "+86 132 3647 9501",
    whatsapp: whatsapp.general,
  },
}

export const billingStaff = [
  { range: "A – G", name: "Mimi", phone: "+233 54 816 7002", phoneDigits: "233548167002" },
  { range: "H – O", name: "Linda", phone: "+233 55 408 4414", phoneDigits: "233554084414" },
  { range: "P – Z", name: "Solo", phone: "+233 55 448 3576", phoneDigits: "233554483576" },
  {
    range: "Special Category",
    name: "Amooksco Desk",
    phone: "+233 55 624 9064",
    phoneDigits: "233556249064",
    note: "Heavy goods, special shipments, or higher CBM",
  },
]

// Mobile Money payment details (bank accounts intentionally removed).
// Update merchantId / number with the official details when confirmed.
export const momo = {
  network: "MTN Mobile Money",
  merchantName: "AMOOKSCO VENTURES",
  merchantId: "000000", // TODO: replace with the official MoMo Merchant ID
  phone: "+86 132 3647 9501", // payment / confirmation line from company flyer
  phoneDigits: "8613236479501",
  isPlaceholder: true,
}

export const services = [
  {
    title: "Sea Cargo",
    desc: "Cost-effective ocean freight from China to Ghana for bulk and heavy goods.",
  },
  {
    title: "Air Cargo",
    desc: "Fast air freight for urgent, light or high-value shipments.",
  },
  {
    title: "China Warehouse",
    desc: "Receive, consolidate and inspect your goods at our China warehouse.",
  },
  {
    title: "Procurement Support",
    desc: "Share a product link — we buy it for you from Alibaba, 1688, Taobao & more.",
  },
  {
    title: "Customs Clearance",
    desc: "Smooth customs documentation and duty support on arrival in Ghana.",
  },
  {
    title: "Ghana Delivery",
    desc: "Last-mile delivery of your packages anywhere across Ghana.",
  },
]

export const marketplaces = ["Alibaba", "1688", "Taobao", "Temu", "Amazon"]

export const workflow = [
  { step: "1", title: "Share Product Link", desc: "Send us the item link or your supplier details." },
  { step: "2", title: "We Buy", desc: "We purchase and receive it at our China warehouse." },
  { step: "3", title: "We Ship", desc: "We consolidate and ship by sea or air to Ghana." },
  { step: "4", title: "You Track", desc: "Track your goods with your shipping mark until delivery." },
]

export const navLinks = [
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Track", href: "/#track" },
  { label: "Estimate", href: "/#estimate" },
  { label: "Payments", href: "/#payments" },
  { label: "About", href: "/about" },
  { label: "Support", href: "/support" },
]

export function waLink(digits: string, text?: string) {
  const base = `https://wa.me/${digits}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}
