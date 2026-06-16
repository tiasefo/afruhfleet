from pathlib import Path

# 1) Patch homepage hero badge text and inject visible video background if missing.
for p in [Path("frontend/app/page.tsx")]:
    if not p.exists():
        continue

    s = p.read_text()
    s = s.replace(
        "Now serving Ghana, Nigeria, and China trade routes",
        "Now serving Ghana, Kenya, and China trade routes"
    )

    # Add visible video background to first hero section/container.
    if "homepage-video-bg" not in s:
        s = s.replace(
            '<section className="relative',
            '<section className="relative',
            1
        )

        # Safer generic injection immediately after first section opening tag end.
        marker = 'className="relative'
        idx = s.find(marker)
        if idx != -1:
            # find the closing > of that tag
            tag_start = s.rfind("<section", 0, idx)
            tag_end = s.find(">", idx)
            if tag_start != -1 and tag_end != -1:
                inject = '''
        <div className="homepage-video-bg pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <video autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover opacity-35">
            <source src="/assets/videos/airport-footage-panama-city-panama-ground-crew-unloading-cargo-shipment-from-airplane-on.webm" type="video/webm" />
            <source src="/assets/videos/Truck20004964.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-white/70" />
        </div>'''
                s = s[:tag_end+1] + inject + s[tag_end+1:]

    p.write_text(s)
    print("patched homepage", p)

# 2) Patch all location pages to make videos visibly autoplay and not dark/blank.
for p in Path("frontend/app/locations").glob("*/page.tsx"):
    s = p.read_text()

    s = s.replace(
        '<div className="absolute inset-0">',
        '<div className="absolute inset-0 bg-slate-900">'
    )

    s = s.replace(
        '<video autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover">',
        '<video autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover opacity-60">'
    )

    # Add explicit type based on extension for better browser compatibility.
    s = s.replace(
        '<source src="/assets/videos/Truck20004964.mp4" />',
        '<source src="/assets/videos/Truck20004964.mp4" type="video/mp4" />'
    )
    s = s.replace(
        '<source src="/assets/videos/27427654-preview.mp4" />',
        '<source src="/assets/videos/27427654-preview.mp4" type="video/mp4" />'
    )
    s = s.replace(
        '<source src="/assets/videos/istockphoto-1473471897-640_adpp_is.mp4" />',
        '<source src="/assets/videos/istockphoto-1473471897-640_adpp_is.mp4" type="video/mp4" />'
    )
    s = s.replace(
        '<source src="/assets/videos/istockphoto-918314666-640_adpp_is.mp4" />',
        '<source src="/assets/videos/istockphoto-918314666-640_adpp_is.mp4" type="video/mp4" />'
    )
    s = s.replace(
        '<source src="/assets/videos/Vans-2220419522-640_adpp_is.mp4" />',
        '<source src="/assets/videos/Vans-2220419522-640_adpp_is.mp4" type="video/mp4" />'
    )
    s = s.replace(
        '<source src="/assets/videos/airport-footage-panama-city-panama-ground-crew-unloading-cargo-shipment-from-airplane-on.webm" />',
        '<source src="/assets/videos/airport-footage-panama-city-panama-ground-crew-unloading-cargo-shipment-from-airplane-on.webm" type="video/webm" />'
    )

    s = s.replace('bg-[#021f2a]/75', 'bg-[#021f2a]/45')
    s = s.replace('via-[#063f4f]/80', 'via-[#063f4f]/55')

    p.write_text(s)
    print("patched location video", p)
