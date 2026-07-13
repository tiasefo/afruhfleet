import Link from "next/link"

export function GenericPage({
  title,
  children,
  primaryColor,
  companyName,
}: {
  title: string
  children?: React.ReactNode
  primaryColor: string
  companyName: string
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/storefront" className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{companyName}</span>
          </Link>
          <Link
            href="/storefront"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            &larr; Back to Storefront
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <div className="mt-6 prose prose-gray max-w-none">
          {children || (
            <p className="text-gray-500">
              Content for this page will be available soon. Please contact{" "}
              <a href="/support" style={{ color: primaryColor }} className="font-medium hover:underline">
                support
              </a>{" "}
              if you need assistance.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
