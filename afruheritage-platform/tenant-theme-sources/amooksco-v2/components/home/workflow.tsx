import { workflow } from "@/lib/amooksco"

export function Workflow() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground">
            How It Works
          </h2>
          <p className="mt-3 text-muted-foreground">
            A simple, transparent process from your supplier in China straight to
            your door in Ghana.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {workflow.map((w, i) => (
            <div key={w.step} className="relative">
              <div className="flex h-full flex-col rounded-xl border border-border bg-background p-6">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {w.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {w.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {w.desc}
                </p>
              </div>
              {i < workflow.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-2xl text-accent lg:block"
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
