"""
Plugin Management API Routes

Admin-only endpoints for managing auto-fix plugins.
Tenant-accessible endpoints for viewing plugin catalog and installing plugins with consent.
"""
from typing import Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import json

from app.api.deps import get_db, require_superuser, get_current_user, require_tenant_admin, require_active_subscription
from app.plugins import get_all_plugins, get_plugin
from app.models.user import User
from app.models.audit import AuditEvent

router = APIRouter(prefix='/plugins', tags=['Plugins'])


class PluginInstallRequest(BaseModel):
    """Request model for plugin installation with explicit consent."""
    plugin_name: str
    consent_ui_change: bool = False
    consent_business_type_change: bool = False
    consent_data_impact: bool = False
    acknowledged_risks: list[str] = []


@router.get("/catalog")
def list_plugin_catalog(
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """List all available plugins as a catalog (accessible to authenticated tenants).
    
    This is a read-only view showing available features/plugins that can be enabled.
    """
    plugins = get_all_plugins()
    result = []
    for plugin in plugins:
        result.append({
            "name": plugin.name,
            "feature_name": plugin.feature_name,
            "description": f"Auto-fix plugin for {plugin.feature_name}",
            "required_endpoints": plugin.required_endpoints,
            "feature_flags": plugin.feature_flags,
        })
    return result


@router.get("/catalog/{plugin_name}")
def get_plugin_catalog_detail(
    plugin_name: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Get detailed catalog information about a specific plugin (accessible to tenants)."""
    plugin = get_plugin(plugin_name)
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_name}' not found")
    
    return {
        "name": plugin.name,
        "feature_name": plugin.feature_name,
        "description": f"Auto-fix plugin for {plugin.feature_name}",
        "required_endpoints": plugin.required_endpoints,
        "feature_flags": plugin.feature_flags,
        "risks": {
            "ui_change": "This plugin may change your storefront appearance and layout",
            "business_type_change": "This plugin may change your industry or business type classification",
            "data_impact": "This plugin may modify or replace existing data in your system"
        }
    }


@router.post("/install")
def install_plugin_with_consent(
    request: PluginInstallRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
    _: User = Depends(require_tenant_admin),
) -> dict[str, Any]:
    """Install a plugin with explicit consent from tenant admin."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User must be associated with a tenant")
    
    plugin = get_plugin(request.plugin_name)
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin '{request.plugin_name}' not found")
    
    # Validate consent requirements
    required_consents = []
    if not request.consent_ui_change:
        required_consents.append("ui_change")
    if not request.consent_business_type_change:
        required_consents.append("business_type_change")
    if not request.consent_data_impact:
        required_consents.append("data_impact")
    
    if required_consents:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required consents: {', '.join(required_consents)}"
        )
    
    # Run auto-fix for the plugin
    success, message = plugin.auto_fix(str(current_user.tenant_id), db)
    health = plugin.get_health(str(current_user.tenant_id), db)
    
    # Replace mock data if plugin has it
    if plugin.has_mock_data:
        mock_success, mock_message = plugin.replace_mock_data(str(current_user.tenant_id), db)
        if not mock_success:
            message += f" | Mock data replacement: {mock_message}"
    
    # Create audit event for legal compliance
    audit_event = AuditEvent(
        actor_email=current_user.email,
        event_type="plugin.installed",
        entity_type="plugin",
        entity_id=plugin.name,
        details_json=json.dumps({
            "plugin_name": plugin.name,
            "feature_name": plugin.feature_name,
            "tenant_id": str(current_user.tenant_id),
            "consent_ui_change": request.consent_ui_change,
            "consent_business_type_change": request.consent_business_type_change,
            "consent_data_impact": request.consent_data_impact,
            "acknowledged_risks": request.acknowledged_risks,
            "auto_fix_success": success,
            "auto_fix_message": message
        })
    )
    db.add(audit_event)
    db.commit()
    
    return {
        "plugin_name": plugin.name,
        "feature_name": plugin.feature_name,
        "tenant_id": str(current_user.tenant_id),
        "success": success,
        "message": message,
        "health": health,
        "consent_recorded": True,
        "mock_data_replaced": plugin.has_mock_data
    }


@router.get("")
def list_plugins(
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_superuser),
) -> list[dict[str, Any]]:
    """List all registered plugins with their health status (admin only)."""
    try:
        plugins = get_all_plugins()
    except Exception:
        return []

    result = []
    for plugin in plugins:
        try:
            health = plugin.get_health(tenant_id=None, db=db)
        except Exception:
            health = {
                "healthy": False,
                "endpoints": plugin.required_endpoints,
                "features": plugin.feature_flags,
                "details": {},
                "auto_fixed": False,
                "error": "Health check failed (no tenant context)",
            }
        result.append({
            "name": plugin.name,
            "feature_name": plugin.feature_name,
            "required_endpoints": plugin.required_endpoints,
            "feature_flags": plugin.feature_flags,
            "health": health,
        })
    return result


@router.get("/{plugin_name}")
def get_plugin_detail(
    plugin_name: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_superuser),
) -> dict[str, Any]:
    """Get detailed information about a specific plugin (admin only)."""
    plugin = get_plugin(plugin_name)
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_name}' not found")
    
    health = plugin.get_health(tenant_id=None, db=db)
    return {
        "name": plugin.name,
        "feature_name": plugin.feature_name,
        "required_endpoints": plugin.required_endpoints,
        "feature_flags": plugin.feature_flags,
        "health": health,
    }


@router.post("/{plugin_name}/check/{tenant_id}")
def check_plugin_for_tenant(
    plugin_name: str,
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_superuser),
) -> dict[str, Any]:
    """Check if a plugin's feature is healthy for a specific tenant (admin only)."""
    plugin = get_plugin(plugin_name)
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_name}' not found")
    
    is_healthy = plugin.check(tenant_id, db)
    health = plugin.get_health(tenant_id, db)
    
    return {
        "plugin_name": plugin.name,
        "tenant_id": tenant_id,
        "healthy": is_healthy,
        "health": health,
    }


@router.post("/{plugin_name}/auto-fix/{tenant_id}")
def auto_fix_plugin_for_tenant(
    plugin_name: str,
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_superuser),
) -> dict[str, Any]:
    """Trigger auto-fix for a plugin's feature for a specific tenant (admin only)."""
    plugin = get_plugin(plugin_name)
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_name}' not found")
    
    success, message = plugin.auto_fix(tenant_id, db)
    health = plugin.get_health(tenant_id, db)
    
    return {
        "plugin_name": plugin.name,
        "tenant_id": tenant_id,
        "success": success,
        "message": message,
        "health": health,
    }
