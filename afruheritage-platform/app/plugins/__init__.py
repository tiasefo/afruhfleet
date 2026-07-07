from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy.orm import Session


class BasePlugin(ABC):
    """Abstract base class for auto-fix plugins.

    Each plugin is responsible for:
    - check(): Determine if a feature/endpoint is healthy for a tenant
    - auto_fix(): Attempt to enable/fix the feature automatically (no admin approval)
    - get_health(): Return a health status dict for monitoring
    - replace_mock_data(): Replace mock data with real tenant data (optional)
    """

    name: str = ""
    feature_name: str = ""
    required_endpoints: list[str] = []
    feature_flags: list[str] = []
    has_mock_data: bool = False  # Whether this plugin handles mock data replacement

    @abstractmethod
    def check(self, tenant_id: str, db: Session) -> bool:
        """Return True if the feature is healthy and all endpoints are available."""
        ...

    @abstractmethod
    def auto_fix(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        """Attempt to auto-fix missing dependencies.

        Returns:
            (success, message) — True if fix succeeded, False if manual intervention needed.
        """
        ...

    @abstractmethod
    def get_health(self, tenant_id: str, db: Session) -> dict[str, Any]:
        """Return a health status dict with keys: healthy, endpoints, details, auto_fixed."""
        ...

    def replace_mock_data(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        """Replace mock data with real tenant data.
        
        Override this method if the plugin handles mock data replacement.
        
        Returns:
            (success, message) — True if replacement succeeded, False if failed.
        """
        if not self.has_mock_data:
            return True, "No mock data to replace for this plugin"
        return False, "Mock data replacement not implemented for this plugin"


# Plugin registry
_registry: list[BasePlugin] = []


def register_plugin(plugin: BasePlugin) -> None:
    """Register a plugin instance."""
    if plugin not in _registry:
        _registry.append(plugin)


def get_all_plugins() -> list[BasePlugin]:
    """Return all registered plugins."""
    return list(_registry)


def get_plugin(name: str) -> BasePlugin | None:
    """Return a plugin by name, or None."""
    for p in _registry:
        if p.name == name:
            return p
    return None


def auto_discover() -> None:
    """Auto-discover and register all plugins in this package."""
    import importlib
    import pkgutil

    for _, module_name, _ in pkgutil.iter_modules(__path__):
        if module_name.startswith("_") or module_name == "base_plugin":
            continue
        try:
            module = importlib.import_module(f"app.plugins.{module_name}")
            if hasattr(module, "PLUGIN"):
                register_plugin(module.PLUGIN)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Failed to load plugin %s: %s", module_name, exc)


# Auto-discover on import
auto_discover()
