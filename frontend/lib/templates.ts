export type Template = {
  slug: string
  name: string
  category: string
  description: string
  themeClass: string
  image: string
  /** representative accent swatches for the gallery card */
  swatches: string[]
  tags: string[]
}

export const templates: Template[] = [
  {
    slug: "fleet",
    name: "Vanta Fleet",
    category: "Fleet & Transportation",
    description:
      "Logistics-grade storefront for fleet operators — vehicle leasing, dispatch, and route management.",
    themeClass: "theme-fleet",
    image: "/images/fleet-hero.png",
    swatches: ["#26324d", "#e8a13a", "#f4f5f8"],
    tags: ["Logistics", "Leasing", "Dispatch"],
  },
  {
    slug: "freight",
    name: "Meridian Freight",
    category: "Shipping & Freight",
    description:
      "Ocean, air, and land freight forwarding storefront with live quote and tracking flows.",
    themeClass: "theme-freight",
    image: "/images/freight-hero.png",
    swatches: ["#1f5d72", "#3aa6b9", "#eef6f8"],
    tags: ["Freight", "Customs", "Tracking"],
  },
  {
    slug: "ecommerce",
    name: "Verde Goods",
    category: "Ecommerce",
    description:
      "Clean, conversion-focused product store with collections, cart, and editorial sections.",
    themeClass: "theme-ecommerce",
    image: "/images/ecommerce-hero.png",
    swatches: ["#2f9e6b", "#e7c14b", "#fbfaf4"],
    tags: ["Retail", "Cart", "Collections"],
  },
  {
    slug: "mall",
    name: "Lumière Mall",
    category: "Shopping Mall",
    description:
      "Premium multi-brand mall directory with stores, dining, events, and floor guide.",
    themeClass: "theme-mall",
    image: "/images/mall-hero.png",
    swatches: ["#2b2722", "#c79a4a", "#f5f1ea"],
    tags: ["Directory", "Brands", "Events"],
  },
  {
    slug: "bookings",
    name: "Skyline Travel",
    category: "Bookings & Ticketing",
    description:
      "Multi-modal booking storefront for flights, buses, and event tickets with a search engine.",
    themeClass: "theme-bookings",
    image: "/images/bookings-hero.png",
    swatches: ["#2f6fd1", "#f08a32", "#eef4fd"],
    tags: ["Flights", "Buses", "Tickets"],
  },
  {
    slug: "restaurant",
    name: "Ember & Oak",
    category: "Restaurant & Food",
    description:
      "Atmospheric dining storefront with menu, reservations, and online ordering. Recommended.",
    themeClass: "theme-restaurant",
    image: "/images/restaurant-hero.png",
    swatches: ["#c0432b", "#e0a23c", "#241d18"],
    tags: ["Menu", "Reservations", "Ordering"],
  },
  {
    slug: "realestate",
    name: "Haven Estates",
    category: "Real Estate",
    description:
      "Refined property listing storefront with search, featured homes, and agent profiles. Recommended.",
    themeClass: "theme-realestate",
    image: "/images/realestate-hero.png",
    swatches: ["#2f5d45", "#b69a5e", "#faf8f2"],
    tags: ["Listings", "Search", "Agents"],
  },
]

export function getTemplate(slug: string) {
  return templates.find((t) => t.slug === slug)
}
