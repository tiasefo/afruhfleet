import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export function TemplatePreviewBar({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[oklch(0.16_0.02_265)] px-4 py-2 text-sm text-white sm:px-6">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1.5 text-white/70 transition-colors hover:text-white"
      >
        <ChevronLeft className="size-4" />
        All templates
      </Link>
      <span className="text-white/50">
        Live preview — <span className="font-medium text-white/80">{name}</span>
      </span>
    </div>
  )
}
