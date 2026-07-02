'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'How does the credit system work for delivery vendors?',
    answer: 'When you accept delivery jobs through the platform, credits are deducted from your account. Once you complete deliveries, you earn revenue which can be withdrawn via mobile money or bank transfer. Credits help manage the flow of jobs and ensure reliable service.',
  },
  {
    question: 'What types of vehicles are accepted?',
    answer: 'We accept all types of delivery vehicles including trucks (all sizes), vans, cars, motorbikes, and bicycles. You can register multiple vehicle types if you have access to different vehicles.',
  },
  {
    question: 'How do I get paid for completed deliveries?',
    answer: 'Payments are processed weekly or on-demand (subject to minimum thresholds). You can receive funds via Mobile Money (MTN, Vodafone, AirtelTigo), bank transfer, or keep them in your platform wallet for credit purchases.',
  },
  {
    question: 'What are the requirements to become a vendor?',
    answer: 'You need a valid Ghana Card or equivalent ID, vehicle registration documents, and a smartphone. For motorized vehicles, you also need valid insurance and a roadworthy certificate.',
  },
  {
    question: 'Can I work in multiple regions?',
    answer: 'Yes! You can select multiple operating regions during registration. This increases your visibility to tenants and freight forwarders across those areas.',
  },
  {
    question: 'Is there insurance coverage for goods in transit?',
    answer: 'Yes, we provide basic coverage for goods in transit through our platform. Additional coverage options are available for high-value shipments.',
  },
  {
    question: 'How do tenants find and book my services?',
    answer: 'Once approved, your profile appears in the vendor marketplace. Tenants can search by location, vehicle type, and ratings. You will receive job notifications and can accept or decline based on your availability.',
  },
  {
    question: 'What is the Delivery Services subscription?',
    answer: 'The Delivery Services subscription is specifically designed for delivery vendors. It uses the same credit model as other platform subscriptions, allowing you to accept jobs, manage deliveries, and receive payments through the platform.',
  },
]

export function VendorFAQ() {
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Everything you need to know about becoming a delivery partner.
          </p>
        </div>

        <Accordion type="single" collapsible className="mt-12">
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
    </section>
  )
}
