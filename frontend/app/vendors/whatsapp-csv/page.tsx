import { WhatsAppCsvUpload } from "@/components/admin/whatsapp-csv-upload";
import { PageActionsBar } from '@/components/shared/page-actions-bar'

export default function AdminWhatsAppCsvPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <PageActionsBar backHref="/vendors" backLabel="Back to Vendors" />
      </div>
      <WhatsAppCsvUpload />
    </main>
  );
}
