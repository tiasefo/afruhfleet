import Link from "next/link"

export function SiteFooter({
  companyName,
  supportEmail,
  supportPhone,
  legalFooterText,
  primaryColor,
}: {
  companyName: string
  supportEmail: string
  supportPhone: string
  legalFooterText: string
  primaryColor: string
}) {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{companyName}</h3>
            <p className="mt-2 text-sm text-gray-500">
              Professional logistics and freight forwarding services.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Quick Links</h3>
            <ul className="mt-2 space-y-2">
              <li>
                <Link href="/track" className="text-sm text-gray-500 hover:text-gray-900">
                  Track Shipment
                </Link>
              </li>
              <li>
                <Link href="/customs" className="text-sm text-gray-500 hover:text-gray-900">
                  Customs Calculator
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm text-gray-500 hover:text-gray-900">
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Contact</h3>
            <ul className="mt-2 space-y-2">
              <li>
                <a href={`mailto:${supportEmail}`} className="text-sm text-gray-500 hover:text-gray-900">
                  {supportEmail}
                </a>
              </li>
              {supportPhone && (
                <li className="text-sm text-gray-500">{supportPhone}</li>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-400">
            {legalFooterText || `\u00A9 ${new Date().getFullYear()} ${companyName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  )
}
