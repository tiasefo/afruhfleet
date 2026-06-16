from pathlib import Path

targets = [
    "frontend/app/customs/page.tsx",
    "frontend/app/customs/duty-calculator/page.tsx",
    "frontend/app/support/page.tsx",
]

section = '''
      {/* AFRU_MARKETING_VIDEO_SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">AfruHeritage freight in motion</h2>
          <p className="mt-3 text-muted-foreground">
            See how airport cargo, seaport movement, customs processing, trucking, and final-mile delivery connect through the AfruHeritage platform.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border bg-black shadow-sm">
            <video autoPlay muted loop playsInline preload="auto" className="h-80 w-full object-cover opacity-90">
              <source src="/assets/videos/airport-footage-panama-city-panama-ground-crew-unloading-cargo-shipment-from-airplane-on.webm" type="video/webm" />
              <source src="/assets/videos/Truck20004964.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-black shadow-sm">
            <video autoPlay muted loop playsInline preload="auto" className="h-80 w-full object-cover opacity-90">
              <source src="/assets/videos/27427654-preview.mp4" type="video/mp4" />
              <source src="/assets/videos/istockphoto-945121252-640_adpp_is.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>
'''

for f in targets:
    p = Path(f)
    s = p.read_text()

    if "AFRU_MARKETING_VIDEO_SECTION" in s:
        print("already present", f)
        continue

    # Insert before footer if page has <Footer />, otherwise before closing </main>
    if "<Footer" in s:
        s = s.replace("<Footer", section + "\n      <Footer", 1)
    elif "</main>" in s:
        s = s.replace("</main>", section + "\n    </main>", 1)
    else:
        print("SKIPPED no insertion point", f)
        continue

    p.write_text(s)
    print("injected", f)
