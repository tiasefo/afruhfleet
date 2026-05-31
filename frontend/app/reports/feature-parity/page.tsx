import { FeatureParityTable } from '@/components/reports/feature-parity-table'
import { PageActionsBar } from '@/components/shared/page-actions-bar'

export default function FeatureParityReportPage() {
  return (
    <main className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-4">
      <PageActionsBar backHref="/admin" backLabel="Back to Admin Dashboard" />
      <h1 className="text-3xl font-bold text-slate-900">Web vs Mobile Feature Parity Review</h1>
      <p className="text-slate-600">
        Deep-dive, source-backed feature comparison with color-coded status for both clients.
      </p>
      <FeatureParityTable />
    </main>
  )
}
