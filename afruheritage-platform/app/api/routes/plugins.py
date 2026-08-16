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
from sqlalchemy import select
import json

from app.api.deps import get_db, require_superuser, get_current_user, require_tenant_admin
from app.plugins import get_all_plugins, get_plugin
from app.models.plugin import Plugin
from app.models.user import User
from app.models.audit import AuditEvent
from app.services.plugin_registry import PluginRegistry
from app.services.plugin_service import PluginService

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
    # Build a map of plugin_code -> is_active from DB
    db_plugins = {p.plugin_code: p for p in db.scalars(select(Plugin)).all()}
    result = []
    for plugin in plugins:
        db_plugin = db_plugins.get(plugin.name)
        result.append({
            "name": plugin.name,
            "feature_name": plugin.feature_name,
            "description": f"Auto-fix plugin for {plugin.feature_name}",
            "required_endpoints": plugin.required_endpoints,
            "feature_flags": plugin.feature_flags,
            "is_active": db_plugin.is_active if db_plugin else True,
        })
    return result


@router.get("/installed")
def list_installed_plugins(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
) -> list[dict[str, Any]]:
    """List all plugins with their installation status for the current tenant."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User must be associated with a tenant")

    service = PluginService(db)
    tenant_id = str(current_user.tenant_id)
    installations = {inst.plugin_code: inst for inst in service.list_for_tenant(tenant_id)}

    plugins = get_all_plugins()
    result = []
    for plugin in plugins:
        installation = installations.get(plugin.name)
        if installation is None or installation.status in {"uninstalled", "failed"}:
            status = "not_installed"
        elif installation.status == "disabled":
            status = "disabled"
        else:
            status = "installed"
        result.append({
            "name": plugin.name,
            "feature_name": plugin.feature_name,
            "feature_flags": plugin.feature_flags,
            "installed": status in {"installed", "enabled"},
            "status": status,
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
    current_user: User = Depends(require_tenant_admin),
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

    service = PluginService(db)
    tenant_id = str(current_user.tenant_id)
    try:
        installation = service.install(tenant_id, plugin.name, installed_by=current_user.id)
        installation = service.enable(tenant_id, plugin.name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Allow the plugin class to perform any extra runtime setup / mock-data replacement
    auto_fix_success, auto_fix_message = plugin.auto_fix(tenant_id, db)
    health = plugin.get_health(tenant_id, db)
    if plugin.has_mock_data:
        mock_success, mock_message = plugin.replace_mock_data(tenant_id, db)
        if not mock_success:
            auto_fix_message += f" | Mock data replacement: {mock_message}"

    # Create audit event for legal compliance
    audit_event = AuditEvent(
        actor_email=current_user.email,
        event_type="plugin.installed",
        entity_type="plugin",
        entity_id=plugin.name,
        details_json=json.dumps({
            "plugin_name": plugin.name,
            "feature_name": plugin.feature_name,
            "tenant_id": tenant_id,
            "consent_ui_change": request.consent_ui_change,
            "consent_business_type_change": request.consent_business_type_change,
            "consent_data_impact": request.consent_data_impact,
            "acknowledged_risks": request.acknowledged_risks,
            "installation_id": str(installation.id),
            "auto_fix_success": auto_fix_success,
            "auto_fix_message": auto_fix_message,
            "health": health,
        })
    )
    db.add(audit_event)
    db.commit()

    return {
        "plugin_name": plugin.name,
        "feature_name": plugin.feature_name,
        "tenant_id": tenant_id,
        "success": True,
        "message": auto_fix_message or "Plugin installed and enabled",
        "health": health,
        "consent_recorded": True,
        "mock_data_replaced": plugin.has_mock_data,
        "installation": service.to_dict(installation),
    }


def _plugin_audit_result(plugin: Plugin, tenant_id: str, enabled: bool) -> dict[str, Any]:
    return {
        "plugin_name": plugin.name,
        "feature_name": plugin.plugin_code,
        "tenant_id": tenant_id,
        "enabled": enabled,
        "feature_flags": plugin.feature_flags,
    }


@router.post("/{plugin_name}/enable")
def enable_plugin(
    plugin_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
) -> dict[str, Any]:
    """Enable a plugin for the current tenant."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User must be associated with a tenant")
    service = PluginService(db)
    try:
        installation = service.enable(str(current_user.tenant_id), plugin_name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    plugin = PluginRegistry(db).get_by_code(plugin_name)
    result = _plugin_audit_result(plugin, str(current_user.tenant_id), True)
    _record_plugin_audit(db, current_user, "plugin.enabled", result)
    return service.to_dict(installation)


@router.post("/{plugin_name}/disable")
def disable_plugin(
    plugin_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
) -> dict[str, Any]:
    """Disable a plugin for the current tenant."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User must be associated with a tenant")
    service = PluginService(db)
    try:
        installation = service.disable(str(current_user.tenant_id), plugin_name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    plugin = PluginRegistry(db).get_by_code(plugin_name)
    result = _plugin_audit_result(plugin, str(current_user.tenant_id), False)
    _record_plugin_audit(db, current_user, "plugin.disabled", result)
    return service.to_dict(installation)


@router.post("/{plugin_name}/uninstall")
def uninstall_plugin(
    plugin_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
) -> dict[str, Any]:
    """Uninstall a plugin for the current tenant."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User must be associated with a tenant")
    service = PluginService(db)
    try:
        installation = service.uninstall(str(current_user.tenant_id), plugin_name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    plugin = PluginRegistry(db).get_by_code(plugin_name)
    result = _plugin_audit_result(plugin, str(current_user.tenant_id), False)
    _record_plugin_audit(db, current_user, "plugin.uninstalled", result)
    return service.to_dict(installation)


def _record_plugin_audit(
    db: Session,
    current_user: User,
    event_type: str,
    result: dict[str, Any],
) -> None:
    audit_event = AuditEvent(
        actor_email=current_user.email,
        event_type=event_type,
        entity_type="plugin",
        entity_id=result["plugin_name"],
        details_json=json.dumps({
            "plugin_name": result["plugin_name"],
            "feature_name": result["feature_name"],
            "tenant_id": result["tenant_id"],
            "feature_flags": result["feature_flags"],
            "enabled": result["enabled"],
        }),
    )
    db.add(audit_event)
    db.commit()


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


@router.patch("/admin/{plugin_code}/activate")
def activate_plugin_globally(
    plugin_code: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_superuser),
) -> dict[str, Any]:
    """Activate a plugin in the global catalog (admin only)."""
    plugin = db.scalar(select(Plugin).where(Plugin.plugin_code == plugin_code))
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_code}' not found")
    plugin.is_active = True
    db.commit()
    return {"plugin_code": plugin.plugin_code, "is_active": True, "message": "Plugin activated globally"}


@router.patch("/admin/{plugin_code}/deactivate")
def deactivate_plugin_globally(
    plugin_code: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_superuser),
) -> dict[str, Any]:
    """Deactivate a plugin in the global catalog (admin only)."""
    plugin = db.scalar(select(Plugin).where(Plugin.plugin_code == plugin_code))
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_code}' not found")
    plugin.is_active = False
    db.commit()
    return {"plugin_code": plugin.plugin_code, "is_active": False, "message": "Plugin deactivated globally"}


@router.patch("/admin/{plugin_code}")
def update_plugin_metadata(
    plugin_code: str,
    updates: dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_superuser),
) -> dict[str, Any]:
    """Update plugin metadata (admin only)."""
    plugin = db.scalar(select(Plugin).where(Plugin.plugin_code == plugin_code))
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_code}' not found")
    if "name" in updates:
        plugin.name = updates["name"]
    if "description" in updates:
        plugin.description = updates["description"]
    if "category" in updates:
        plugin.category = updates["category"]
    if "version" in updates:
        plugin.version = updates["version"]
    db.commit()
    return {
        "plugin_code": plugin.plugin_code,
        "name": plugin.name,
        "description": plugin.description,
        "category": plugin.category,
        "version": plugin.version,
        "is_active": plugin.is_active,
        "message": "Plugin updated",
    }

