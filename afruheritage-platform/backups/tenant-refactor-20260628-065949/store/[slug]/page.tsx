import { notFound } from 'next/navigation'
import { Hero } from '@/components/amooksco-v2/home/hero'
import { Workflow } from '@/components/amooksco-v2/home/workflow'
import { Services } from '@/components/amooksco-v2/home/services'
import { Track } from '@/components/amooksco-v2/home/track'
import { Estimator } from '@/components/amooksco-v2/home/estimator'
import { Payments } from '@/components/amooksco-v2/home/payments'
import { CTA } from '@/components/amooksco-v2/home/cta'
import { SiteHeader } from '@/components/amooksco-v2/site-header'
import { SiteFooter } from '@/components/amooksco-v2/site-footer'

export default async function TenantStorePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (slug !== 'amooksco-logistics') {
    notFound()
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Workflow />
        <Services />
        <Track />
        <Estimator />
        <Payments />
        <CTA />
      </main>
      <SiteFooter />
    </>
  )
}
