#!/usr/bin/env python3
import ast
import re
from pathlib import Path

BACKEND_ROOT = Path("afruheritage-platform/app")
ROUTES_ROOT = BACKEND_ROOT / "api" / "routes"

# --- Fleetbase → Fleet Engine config mapping ---
CONFIG_IMPORT = "from app.core.config import settings"
URL_PATTERNS = [
    r"https://api\.fleetbase[^\"']*",
    r"https://.*fleetbase[^\"']*",
    r"fleetbase\.io",
]

def has_tenant_arg(fn: ast.FunctionDef) -> bool:
    for arg in fn.args.args:
        if arg.arg == "tenant_id":
            return True
    return False

def add_tenant_arg(fn: ast.FunctionDef) -> None:
    if has_tenant_arg(fn):
        return
    new_arg = ast.arg(arg="tenant_id", annotation=ast.Name(id="str"))
    fn.args.args.insert(0, new_arg)

def patch_routes_file(path: Path) -> bool:
    src = path.read_text(encoding="utf-8")
    tree = ast.parse(src)
    modified = False

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            if not node.decorator_list:
                continue
            if not any(
                isinstance(d, ast.Call)
                and isinstance(d.func, ast.Attribute)
                and d.func.attr in {"get", "post", "put", "delete", "patch"}
                for d in node.decorator_list
            ):
                continue

            if not has_tenant_arg(node):
                add_tenant_arg(node)
                modified = True

    if modified:
        new_src = ast.unparse(tree)
        path.write_text(new_src, encoding="utf-8")
    return modified

def patch_fleetbase_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text

    # Ensure config import
    if CONFIG_IMPORT not in text:
        text = CONFIG_IMPORT + "\n" + text

    # Replace URLs with settings
    for pat in URL_PATTERNS:
        text = re.sub(pat, "settings.FLEET_ENGINE_BASE_URL", text)

    # Replace API key usage + env prefixes
    text = re.sub(r"FLEETBASE_API_KEY", "settings.FLEET_ENGINE_API_KEY", text)
    text = re.sub(r"FLEETBASE_", "FLEET_ENGINE_", text)

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False

def main():
    patched_routes = []
    patched_fleet = []

    # 1) Multi-tenant route patching
    for py in ROUTES_ROOT.rglob("*.py"):
        if "test" in py.name:
            continue
        if patch_routes_file(py):
            patched_routes.append(str(py))

    # 2) Fleetbase → Fleet Engine patching
    for py in BACKEND_ROOT.rglob("*.py"):
        if "tests" in str(py):
            continue
        if patch_fleetbase_file(py):
            patched_fleet.append(str(py))

    print("=== Multi-tenant routes patched ===")
    for p in patched_routes:
        print("  -", p)

    print("\n=== Fleetbase → Fleet Engine patched ===")
    for p in patched_fleet:
        print("  -", p)

if __name__ == "__main__":
    main()
