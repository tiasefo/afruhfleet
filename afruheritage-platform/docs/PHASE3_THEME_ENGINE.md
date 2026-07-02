# Phase 3 — Theme Engine
## Architecture Refactor Report

> Phase 3 builds a dynamic per-tenant theme engine on top of the TenantContext from Phase 2.
> No AfruHeritage theme imports remain in tenant-facing components.

---

## 1. What Was Built

### New Files

| File | Purpose |
|---|---|
| `lib/tenant-context-server.ts` | Server-side tenant context fetcher + CSS variable generator for SSR |
| `components/tenant-theme-injector.tsx` | Server component that injects `<style>` tag with tenant CSS variables and favicon `<link>` |
| `components/tenant-logo.tsx` | Dynamic logo component: renders tenant logo image or falls back to initial letter |
| `components/tenant-brand.tsx` | TenantBrandName, TenantTagline, TenantFooterText components |

### Modified Files

| File | Change |
|---|---|
| `styles/globals.css` | Added `--tenant-*` CSS custom properties and `:root:has(.tenant-themed)` override rules |
| `app/layout.tsx` | Wrapped app in `<TenantContextProvider>` with `.tenant-themed` wrapper div |
| `components/landing/navigation.tsx` | Replaced hardcoded "Afruheritage" logo with `<TenantLogo>`, added `useTenant()` for language support |
| `components/landing/footer.tsx` | Replaced hardcoded brand name, tagline, footer text, legal links, and languages with tenant-aware equivalents |
| `components/landing/cta-section.tsx` | Replaced hardcoded company name, support email, and phone with tenant contact data |
| `components/support/track-ticket-section.tsx` | Replaced hardcoded support email and phone with tenant contact data |

---

## 2. Theme Engine Architecture

### CSS Variable Flow

```
Backend (TenantBranding model)
  ↓
API: GET /api/v1/tenant-context/{slug}
  ↓
Frontend: TenantContextProvider fetches context
  ↓
applyTenantThemeToCSS() injects CSS variables at runtime:
  --primary, --secondary, --accent, --background, --foreground,
  --success, --warning, --danger, --radius, --font-sans
  ↓
globals.css :root:has(.tenant-themed) applies overrides:
  --primary → var(--tenant-primary, var(--primary))
  --secondary → var(--tenant-secondary, var(--secondary))
  --accent → var(--tenant-accent, var(--accent))
  --background → var(--tenant-background, var(--background))
  --foreground → var(--tenant-foreground, var(--foreground))
  --radius → var(--tenant-radius, var(--radius))
  ↓
Tailwind CSS classes (bg-primary, text-foreground, etc.) use overridden variables
```

### Component Flow

```
<TenantContextProvider>
  <div className="tenant-themed">
    <Navigation>
      <TenantLogo href="/" />  ← renders tenant logo or initial
    </Navigation>
    <CTASection>
      uses tenant.company_name, tenant.contact.support_email
    </CTASection>
    <Footer>
      <TenantLogo href="/" />
      <TenantFooterText />  ← renders tenant legal footer
      uses tenant.legal.privacy_url, tenant.legal.terms_url
      uses tenant.supported_languages
    </Footer>
  </div>
</TenantContextProvider>
```

---

## 3. Hardcoded References Removed

| File | Before | After |
|---|---|---|
| `navigation.tsx` | `<span>Afruheritage</span>` (2 places) | `<TenantLogo href="/" />` |
| `footer.tsx` | `<span>Afruheritage</span>` | `<TenantLogo href="/" />` |
| `footer.tsx` | `"AI-powered freight forwarding..."` | `tenant?.tagline \|\| '...'` |
| `footer.tsx` | `"© year Afruheritage. Powered by..."` | `<TenantFooterText />` |
| `footer.tsx` | `href="/privacy"`, `href="/terms"` | `tenant?.legal?.privacy_url`, `tenant?.legal?.terms_url` |
| `footer.tsx` | Hardcoded `[{en}, {zh}]` languages | `tenant?.supported_languages` |
| `cta-section.tsx` | `"Afruheritage"` in CTA text | `tenant?.company_name` |
| `cta-section.tsx` | `support@afruheritage.com` | `tenant?.contact?.support_email` |
| `cta-section.tsx` | `+233000000000` | `tenant?.contact?.support_phone` |
| `track-ticket-section.tsx` | `support@afruheritage.com` | `tenant?.contact?.support_email` |
| `track-ticket-section.tsx` | `+233000000000` | `tenant?.contact?.support_phone` |

---

## 4. Fallback Behavior

When no tenant context is available (e.g., platform landing page on localhost):
- `TenantLogo` renders "A" in a primary-colored box + "Afruheritage" text
- `TenantFooterText` renders "© {year} Afruheritage. All rights reserved."
- `CTASection` uses "Afruheritage" as company name
- Contact info falls back to `support@afruheritage.com` and `+233 (0) 00 000 0000`
- CSS variables use the default oklch values from `globals.css`
- Languages default to English and Chinese

This ensures the platform's own branding still works when no tenant is resolved.

---

## 5. Verification Results

### TypeScript
- ✅ `tsc --noEmit` — clean, no errors

### Next.js Build
- ✅ `next build` — successful, all 26 routes built
- ✅ Middleware active ("Proxy (Middleware)" in build output)

### Backend
- ✅ `GET /api/v1/tenant-context/empire-drips` — returns `#1A73E8` primary color, `niblzsv@gmail.com` support email
- ✅ `GET /api/v1/tenant-context/amooksco-logistics` — returns default colors (no branding row)
- ✅ Health check passing

---

## 6. What Was NOT Changed

- No database schema changes
- No backend route changes (beyond Phase 2)
- No authentication flow altered
- No existing page routes removed
- Cookie names (`afruheritage_*`) not yet changed — that's Phase 8
- `app/layout.tsx` metadata still hardcoded — that's Phase 4

---

## 7. Risks

1. **Client-side theme flash** — `TenantContextProvider` fetches tenant context on mount, so there may be a brief flash of default colors before tenant colors are applied. This will be resolved in Phase 4 with server-side context resolution.
2. **Image domains** — `next/image` may need `remotePatterns` config for tenant logo URLs from external domains.
3. **Cookie names still hardcoded** — `afruheritage_access_token` and `afruheritage_user` remain in navigation, login form, and other components. These will be addressed in Phase 8 (Authentication).

---

## 8. Next Steps

Phase 4 will build the Metadata Engine:
- `generateMetadata()` in layout/pages using TenantContext
- Per-tenant OG images, Twitter cards, canonical URLs
- Per-tenant favicons via metadata API
- Per-tenant structured data (JSON-LD)
- Remove hardcoded metadata from `app/layout.tsx`
