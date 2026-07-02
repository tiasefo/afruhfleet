from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.tenant_branding import TenantBranding
from app.services.tenant_context_service import get_tenant_from_request

router = APIRouter(prefix="/assets", tags=["Tenant Assets"])


@router.get("/favicon.ico")
async def get_tenant_favicon(request: Request, db: Session = Depends(get_db)):
    """Serve tenant-specific favicon.ico based on subdomain."""
    tenant = get_tenant_from_request(request, db)
    
    if not tenant:
        # Return default platform favicon
        return RedirectResponse(url="/static/default-favicon.ico")
    
    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant.id))
    
    if branding and branding.favicon_url:
        return RedirectResponse(url=branding.favicon_url)
    
    # Return default if no custom favicon
    return RedirectResponse(url="/static/default-favicon.ico")


@router.get("/robots.txt")
async def get_tenant_robots_txt(request: Request, db: Session = Depends(get_db)):
    """Serve tenant-specific robots.txt based on subdomain."""
    tenant = get_tenant_from_request(request, db)
    
    if not tenant:
        # Default robots.txt for platform
        return Response(
            content="User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/",
            media_type="text/plain"
        )
    
    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant.id))
    
    # Tenant-specific robots.txt
    content = f"""User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/

Sitemap: https://{tenant.slug}.afruheritage.com/sitemap.xml
"""
    
    return Response(content=content, media_type="text/plain")


@router.get("/sitemap.xml")
async def get_tenant_sitemap_xml(request: Request, db: Session = Depends(get_db)):
    """Serve tenant-specific sitemap.xml based on subdomain."""
    tenant = get_tenant_from_request(request, db)
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant.id))
    company_name = branding.company_name if branding else tenant.company_name
    
    base_url = f"https://{tenant.slug}.afruheritage.com"
    
    # Generate sitemap.xml
    content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>{base_url}/</loc>
        <lastmod>{tenant.created_at.strftime('%Y-%m-%d')}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>{base_url}/about</loc>
        <lastmod>{tenant.created_at.strftime('%Y-%m-%d')}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>{base_url}/privacy</loc>
        <lastmod>{tenant.created_at.strftime('%Y-%m-%d')}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>{base_url}/terms</loc>
        <lastmod>{tenant.created_at.strftime('%Y-%m-%d')}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>{base_url}/track</loc>
        <lastmod>{tenant.created_at.strftime('%Y-%m-%d')}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>{base_url}/support</loc>
        <lastmod>{tenant.created_at.strftime('%Y-%m-%d')}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
</urlset>
"""
    
    return Response(content=content, media_type="application/xml")
