import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { Notices } from "@/components/home/notices"

export const metadata: Metadata = {
  title: "New Arrivals — AMOOKSCO Logistics",
  description:
    "Latest container arrivals, in-transit shipments and China warehouse updates from AMOOKSCO Logistics.",
}

export default function NewArrivalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Warehouse"
        title="New Arrivals"
        description="The latest container arrivals, in-transit shipments and warehouse receiving updates. Check your shipping mark on the updated sheet."
      />
      <Notices />
    </>
  )
}
