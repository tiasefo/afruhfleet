'use client'

import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'How do I track my shipment?',
    answer: 'You can track your shipment using our public tracking page. Simply enter your tracking number or use the quick search on your dashboard. For registered users, all your shipments are automatically tracked and visible in real-time on the map view.',
  },
  {
    question: 'What documents do I need for customs clearance?',
    answer: 'For Ghana customs clearance, you typically need: Commercial Invoice, Bill of Lading or Airway Bill, Packing List, Import Declaration Form (IDF), and relevant permits for restricted goods. Our platform helps you manage all these documents digitally.',
  },
  {
    question: 'How long does shipping from China to Ghana take?',
    answer: 'Sea freight typically takes 25-35 days from Chinese ports to Tema Port, Ghana. Air freight takes 3-5 business days. Transit times may vary based on the shipping line, customs processing, and final destination within Ghana.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept payments via Mobile Money (MTN, Vodafone Cash, AirtelTigo Money), bank transfer, and major credit/debit cards. For regular customers, we also offer credit terms and wallet-based payments.',
  },
  {
    question: 'How does the AI assistant work?',
    answer: 'Our AI assistant is available 24/7 to help you with common questions about shipments, quotes, and customs. It can provide instant tracking updates, generate preliminary quotes, and answer FAQs in both English and Chinese. For complex issues, it will create a support ticket for our team.',
  },
  {
    question: 'Can I import shipments in bulk via CSV?',
    answer: 'Yes! Our CSV import feature allows you to upload hundreds of shipments at once. Download our template, fill in your shipment details, and upload the file. The system validates your data and creates all shipments automatically.',
  },
  {
    question: 'What happens if my shipment is delayed?',
    answer: 'If your shipment is delayed, you will receive automatic notifications via email and SMS. You can also track the current status in real-time on our platform. For significant delays, our team will proactively reach out with updates and solutions.',
  },
  {
    question: 'How do I get a shipping quote?',
    answer: 'You can request a quote through our platform by providing the origin, destination, cargo type, and weight/volume. Our AI can provide instant estimates for standard routes, or you can request a detailed quote from our team for special cargo.',
  },
]

export function FAQSection() {
  return (
    <section className="bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="outline" className="mb-4">
            FAQ
          </Badge>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-muted-foreground">
            Find quick answers to common questions about our platform and services.
          </p>
        </div>

        <div className="mt-10">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
