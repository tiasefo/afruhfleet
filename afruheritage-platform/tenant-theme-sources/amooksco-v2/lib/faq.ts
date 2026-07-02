export type Faq = {
  question: string
  answer: string
  keywords: string[]
}

// ~20 freight forwarding FAQs used by the in-house chatbot ("Amo").
// These are matched by keyword so the assistant works without any external AI service.
export const faqs: Faq[] = [
  {
    question: "How does shipping from China to Ghana work?",
    answer:
      "It is simple: you (or we) buy the goods in China, ship them to our Guangdong warehouse, we consolidate them, then forward by sea or air to Ghana, clear customs, and deliver to you. You only need to share your shipping mark so we can match your goods.",
    keywords: ["how", "work", "process", "ship", "shipping", "china", "start", "begin", "send"],
  },
  {
    question: "What is the difference between sea freight and air freight?",
    answer:
      "Sea freight is cheaper and best for large or heavy goods, but takes longer (about 30-45 days). Air freight is faster (about 7-14 days) but costs more and is charged by weight. Choose sea for bulk and air for urgent or light items.",
    keywords: ["difference", "sea", "air", "freight", "versus", "vs", "compare", "faster", "cheaper"],
  },
  {
    question: "How long does delivery take?",
    answer:
      "Sea cargo from China to Ghana usually takes about 30-45 days door to door, while air cargo takes about 7-14 days. Timelines can vary with customs, weather, and shipping schedules.",
    keywords: ["how", "long", "time", "duration", "days", "delivery", "deliver", "arrive", "take", "eta", "transit"],
  },
  {
    question: "How is sea freight priced?",
    answer:
      "Sea freight is charged by CBM (cubic meters) — the volume your goods occupy. CBM = length x width x height in meters. You can use the cost estimator on our homepage for a rough figure, then confirm the exact rate with our billing team.",
    keywords: ["price", "pricing", "cost", "charge", "cbm", "cubic", "volume", "sea", "rate", "how much"],
  },
  {
    question: "How is air freight priced?",
    answer:
      "Air freight is charged by weight in kilograms (kg). For light but bulky goods, volumetric (dimensional) weight may apply. Share the weight and dimensions and our team will confirm the rate.",
    keywords: ["price", "pricing", "cost", "charge", "air", "weight", "kg", "kilogram", "rate", "how much"],
  },
  {
    question: "What is a CBM and how do I calculate it?",
    answer:
      "CBM (cubic meter) measures the volume of your cargo. Calculate it as length x width x height, all in meters. For example, a 0.5m x 0.4m x 0.3m box is 0.06 CBM. Our homepage estimator does this for you.",
    keywords: ["cbm", "cubic", "calculate", "volume", "measure", "dimensions", "meter"],
  },
  {
    question: "What is a shipping mark and why do I need one?",
    answer:
      "A shipping mark is your unique label (usually your name or code) written on every package. It lets us identify and match your goods at the warehouse and during delivery. Always ask your supplier to write your AMOOKSCO shipping mark on the boxes.",
    keywords: ["shipping mark", "mark", "label", "identify", "code", "name", "tag"],
  },
  {
    question: "How do I track my goods?",
    answer:
      "Use the Track section on our website with your shipping mark, or message our tracking line on WhatsApp at +233 55 624 9064 (Priscilla). Please allow 4-5 days after arrival for special checks before following up.",
    keywords: ["track", "tracking", "status", "where", "find", "locate", "goods", "shipment", "parcel"],
  },
  {
    question: "How can I pay for my shipment?",
    answer:
      "We accept MTN Mobile Money. Send payment to our merchant account, then share a screenshot with the billing team for confirmation. Always confirm the current Merchant ID with us on WhatsApp before paying — never pay an unverified number.",
    keywords: ["pay", "payment", "momo", "mobile money", "mtn", "merchant", "money", "how to pay"],
  },
  {
    question: "Who handles billing for my goods?",
    answer:
      "Billing is split by the first letter of your name: A-G is Mimi, H-O is Linda, and P-Z is Solo. Special or heavy goods go through the Amooksco Desk. Reach out on WhatsApp and we will direct you to the right person.",
    keywords: ["billing", "bill", "invoice", "who", "contact", "agent", "charge", "payment desk"],
  },
  {
    question: "Can you buy goods on my behalf (procurement)?",
    answer:
      "Yes. Through our buy-for-me service we can purchase from suppliers and online platforms in China, receive the goods at our warehouse, and ship them to you. Send us the product links or details and we will give you a quote.",
    keywords: ["buy", "procurement", "purchase", "for me", "sourcing", "source", "order", "agent", "behalf"],
  },
  {
    question: "What is the warehouse address in China?",
    answer:
      "We provide each customer with our Guangdong warehouse address and your shipping mark once you register a shipment. Message us on WhatsApp at +233 55 624 9064 or our China line +86 132 3647 9501 to receive the full address.",
    keywords: ["warehouse", "address", "china", "guangzhou", "guangdong", "where", "send", "location", "drop"],
  },
  {
    question: "Do you handle customs clearance?",
    answer:
      "Yes. We manage customs clearance for your cargo as part of our freight service, so you do not have to deal with the process yourself. Any official duties are confirmed with you before delivery.",
    keywords: ["customs", "clearance", "clear", "duty", "duties", "import", "tax", "port"],
  },
  {
    question: "Are there goods you cannot ship?",
    answer:
      "Prohibited and restricted items (such as weapons, flammable liquids, certain chemicals, and counterfeit goods) cannot be shipped. If you are unsure about an item, ask us first and we will advise before you buy.",
    keywords: ["prohibited", "restricted", "cannot", "banned", "illegal", "dangerous", "allowed", "ship", "items"],
  },
  {
    question: "What happens if my goods are delayed?",
    answer:
      "Occasional delays happen due to customs, vessel schedules, or peak seasons. We monitor every shipment and update you. If your goods have not arrived in the expected window, contact our tracking line and we will investigate.",
    keywords: ["delay", "delayed", "late", "stuck", "not arrived", "missing", "waiting", "overdue"],
  },
  {
    question: "Do you offer door-to-door delivery in Ghana?",
    answer:
      "Yes. After customs clearance we arrange last-mile delivery to your location in Ghana. Delivery within Accra and to other regions can be arranged — share your address for a delivery quote.",
    keywords: ["door", "delivery", "deliver", "ghana", "accra", "last mile", "home", "address", "region"],
  },
  {
    question: "How should my goods be packaged?",
    answer:
      "Goods should be packed in strong cartons or sacks, well sealed, and clearly marked with your shipping mark. Fragile items should be padded. Proper packaging protects your goods during the long journey.",
    keywords: ["package", "packaging", "pack", "carton", "box", "wrap", "protect", "fragile", "seal"],
  },
  {
    question: "Is my cargo insured?",
    answer:
      "We handle your goods with great care, but standard freight has limited liability. For high-value items, talk to us about insurance options before shipping so you are fully covered.",
    keywords: ["insure", "insurance", "cover", "damage", "lost", "loss", "protect", "liability", "value"],
  },
  {
    question: "Is there a minimum quantity or weight to ship?",
    answer:
      "No strict minimum — we consolidate small shipments with others, so even a few cartons can be shipped affordably. For very small parcels, air may be more practical. Contact us for the best option.",
    keywords: ["minimum", "quantity", "small", "few", "little", "consolidate", "least", "limit", "how many"],
  },
  {
    question: "How do I get a quote or start a shipment?",
    answer:
      "Message us on WhatsApp at +233 55 624 9064 with your goods details (type, quantity, weight or CBM, and destination) and we will send a quote and your shipping mark. You can also use the cost estimator on our homepage for a quick estimate.",
    keywords: ["quote", "get a quote", "start a shipment", "get started", "register", "begin shipping"],
  },
]

export const FAQ_FALLBACK =
  "I'm not fully sure about that one. For the quickest help, message our team on WhatsApp at +233 55 624 9064 (tracking) or call our China office on +86 132 3647 9501. You can also ask me about shipping, pricing (CBM), tracking, payments, or procurement."

export const FAQ_GREETING =
  "Hi! I'm Amo, your AMOOKSCO assistant. I can help with shipping from China to Ghana, sea vs air freight, CBM pricing, tracking, Mobile Money payments, customs, and buying goods for you. What would you like to know?"

// Lightweight keyword scorer: returns the best-matching FAQ answer for a query.
export function matchFaq(query: string): string {
  const q = query.toLowerCase()
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|yo|hola)\b/.test(q.trim())) {
    return FAQ_GREETING
  }

  let best: Faq | null = null
  let bestScore = 0

  for (const faq of faqs) {
    let score = 0
    for (const kw of faq.keywords) {
      if (q.includes(kw)) {
        // Multi-word keywords are stronger signals.
        score += kw.includes(" ") ? 3 : 1
      }
    }
    if (score > bestScore) {
      bestScore = score
      best = faq
    }
  }

  if (best && bestScore >= 2) return best.answer
  if (best && bestScore === 1) return best.answer
  return FAQ_FALLBACK
}
