"""
Page Generator Service

This service automatically generates missing pages for templates that don't include
all required platform pages. It uses the template's branding, theme, and styling to
ensure generated pages are consistent with the template's design.
"""
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.tenant_branding import TenantBranding
from app.models.tenant import Tenant
import json


# Required pages for a complete storefront
REQUIRED_PAGES = {
    "home": {
        "title": "Home",
        "description": "Main landing page",
        "required": True,
        "content_type": "hero_sections",
    },
    "about": {
        "title": "About Us", 
        "description": "Company information page",
        "required": True,
        "content_type": "text_content",
    },
    "services": {
        "title": "Services",
        "description": "Services and features page",
        "required": True,
        "content_type": "service_cards",
    },
    "contact": {
        "title": "Contact",
        "description": "Contact information and form",
        "required": True,
        "content_type": "contact_form",
    },
    "tracking": {
        "title": "Track Shipment",
        "description": "Shipment tracking page",
        "required": False,  # Optional for basic templates
        "content_type": "tracking_form",
    },
    "pricing": {
        "title": "Pricing",
        "description": "Pricing and plans page",
        "required": False,
        "content_type": "pricing_table",
    },
    "faq": {
        "title": "FAQ",
        "description": "Frequently asked questions",
        "required": False,
        "content_type": "faq_accordion",
    },
    "privacy": {
        "title": "Privacy Policy",
        "description": "Privacy policy page",
        "required": True,
        "content_type": "legal_content",
    },
    "terms": {
        "title": "Terms of Service",
        "description": "Terms and conditions page",
        "required": True,
        "content_type": "legal_content",
    },
}


class PageGeneratorService:
    """Service for generating missing pages based on template branding."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_template_pages(self, template_code: str) -> List[str]:
        """Get the list of pages available in a template.
        
        This would typically read from the template's file structure or
        a template manifest file. For now, we'll return a basic set.
        """
        # In a real implementation, this would scan the template directory
        # or read a template manifest file
        template_page_manifests = {
            "amooksco": ["home", "about", "services", "contact", "tracking"],
            "freight": ["home", "about", "services", "contact", "tracking", "pricing"],
            "basic": ["home", "about", "contact"],
        }
        
        return template_page_manifests.get(template_code, ["home", "about", "contact"])
    
    def get_missing_pages(self, template_code: str) -> List[Dict]:
        """Identify which required pages are missing from a template."""
        template_pages = self.get_template_pages(template_code)
        missing_pages = []
        
        for page_key, page_info in REQUIRED_PAGES.items():
            if page_info["required"] and page_key not in template_pages:
                missing_pages.append({
                    "key": page_key,
                    **page_info
                })
        
        return missing_pages
    
    def generate_page_content(
        self, 
        page_key: str, 
        branding: TenantBranding,
        tenant: Tenant
    ) -> Dict:
        """Generate page content using template branding.
        
        This creates the content structure for a missing page,
        applying the template's colors, fonts, and styling.
        """
        page_info = REQUIRED_PAGES[page_key]
        
        # Base page structure with branding applied
        page_content = {
            "page_key": page_key,
            "title": page_info["title"],
            "description": page_info["description"],
            "content_type": page_info["content_type"],
            "branding": {
                "primary_color": branding.primary_color,
                "secondary_color": branding.secondary_color,
                "accent_color": branding.accent_color,
                "background_color": branding.background_color,
                "font_family": branding.font_family if hasattr(branding, 'font_family') else "Inter, sans-serif",
                "theme_class": branding.theme_class if hasattr(branding, 'theme_class') else "theme-default",
            },
            "company_info": {
                "name": tenant.company_name,
                "tagline": branding.tagline if branding.tagline else f"{tenant.company_name} - Quality Services",
                "contact_email": branding.support_email if branding.support_email else tenant.contact_email,
                "contact_phone": branding.support_phone,
            },
            "sections": self._generate_page_sections(page_key, branding, tenant),
        }
        
        return page_content
    
    def _generate_page_sections(
        self, 
        page_key: str, 
        branding: TenantBranding,
        tenant: Tenant
    ) -> List[Dict]:
        """Generate page sections based on page type and branding."""
        
        sections = []
        
        if page_key == "home":
            sections = [
                {
                    "type": "hero",
                    "title": f"Welcome to {tenant.company_name}",
                    "subtitle": branding.tagline or "Quality Services Delivered",
                    "background_color": branding.primary_color,
                    "text_color": "#ffffff",
                },
                {
                    "type": "features",
                    "title": "Our Services",
                    "items": [
                        {"title": "Fast Delivery", "description": "Quick and reliable service"},
                        {"title": "Quality Support", "description": "24/7 customer support"},
                        {"title": "Competitive Pricing", "description": "Best rates in the market"},
                    ],
                },
            ]
        elif page_key == "about":
            sections = [
                {
                    "type": "text_content",
                    "title": "About Us",
                    "content": f"{tenant.company_name} is dedicated to providing exceptional services to our customers.",
                },
                {
                    "type": "values",
                    "title": "Our Values",
                    "items": ["Quality", "Integrity", "Customer Focus"],
                },
            ]
        elif page_key == "services":
            sections = [
                {
                    "type": "service_cards",
                    "title": "Our Services",
                    "services": [
                        {"name": "Freight Forwarding", "description": "Global shipping solutions"},
                        {"name": "Warehousing", "description": "Secure storage facilities"},
                        {"name": "Customs Clearance", "description": "Expert customs handling"},
                    ],
                },
            ]
        elif page_key == "contact":
            sections = [
                {
                    "type": "contact_info",
                    "title": "Contact Us",
                    "email": tenant.contact_email,
                    "phone": branding.support_phone,
                },
                {
                    "type": "contact_form",
                    "title": "Send us a message",
                },
            ]
        elif page_key == "tracking":
            sections = [
                {
                    "type": "tracking_form",
                    "title": "Track Your Shipment",
                    "description": "Enter your tracking number to see shipment status",
                },
            ]
        elif page_key in ["privacy", "terms"]:
            sections = [
                {
                    "type": "legal_content",
                    "title": page_info["title"],
                    "content": f"Legal content for {tenant.company_name}. This should be replaced with actual legal text.",
                },
            ]
        
        return sections
    
    def generate_missing_pages(
        self, 
        tenant_id: str, 
        template_code: str
    ) -> Dict[str, any]:
        """Generate all missing pages for a tenant's template.
        
        Returns:
            Dict with generated pages info and any errors
        """
        try:
            tenant = self.db.get(Tenant, tenant_id)
            if not tenant:
                return {"success": False, "error": "Tenant not found"}
            
            branding = self.db.query(TenantBranding).filter(
                TenantBranding.tenant_id == tenant_id
            ).first()
            
            if not branding:
                branding = TenantBranding(
                    tenant_id=tenant.id,
                    company_name=tenant.company_name,
                )
                self.db.add(branding)
                self.db.commit()
            
            missing_pages = self.get_missing_pages(template_code)
            generated_pages = []
            
            for page_info in missing_pages:
                page_content = self.generate_page_content(
                    page_info["key"], 
                    branding, 
                    tenant
                )
                generated_pages.append(page_content)
            
            # Store generated pages in storefront_config
            if not branding.storefront_config:
                branding.storefront_config = {}
            
            branding.storefront_config["generated_pages"] = generated_pages
            branding.storefront_config["template_code"] = template_code
            
            self.db.add(branding)
            self.db.commit()
            
            return {
                "success": True,
                "generated_pages": generated_pages,
                "missing_count": len(missing_pages),
                "template_code": template_code,
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "generated_pages": [],
            }
    
    def get_page_status(self, tenant_id: str) -> Dict[str, any]:
        """Get the status of pages for a tenant (existing vs generated)."""
        try:
            branding = self.db.query(TenantBranding).filter(
                TenantBranding.tenant_id == tenant_id
            ).first()
            
            if not branding:
                return {
                    "success": False,
                    "error": "Branding not found",
                    "pages": {},
                }
            
            template_code = branding.template_code or "basic"
            template_pages = self.get_template_pages(template_code)
            generated_pages = branding.storefront_config.get("generated_pages", [])
            
            generated_keys = [p["page_key"] for p in generated_pages]
            
            page_status = {}
            for page_key, page_info in REQUIRED_PAGES.items():
                page_status[page_key] = {
                    "required": page_info["required"],
                    "in_template": page_key in template_pages,
                    "generated": page_key in generated_keys,
                    "source": "template" if page_key in template_pages else "generated" if page_key in generated_keys else "missing",
                }
            
            return {
                "success": True,
                "template_code": template_code,
                "pages": page_status,
                "total_required": sum(1 for p in REQUIRED_PAGES.values() if p["required"]),
                "total_in_template": len(template_pages),
                "total_generated": len(generated_pages),
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "pages": {},
            }


def generate_pages_for_tenant(tenant_id: str, db: Session) -> Dict[str, any]:
    """Convenience function to generate missing pages for a tenant."""
    service = PageGeneratorService(db)
    
    # Get tenant to determine template
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        return {"success": False, "error": "Tenant not found"}
    
    branding = db.query(TenantBranding).filter(
        TenantBranding.tenant_id == tenant_id
    ).first()
    
    template_code = branding.template_code if branding else "basic"
    
    return service.generate_missing_pages(tenant_id, template_code)
