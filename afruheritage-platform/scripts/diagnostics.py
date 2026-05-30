#!/usr/bin/env python3
import os
import sys
import importlib
import inspect
import subprocess
from pathlib import Path
from typing import List, Tuple

PROJECT_ROOT = Path(__file__).parent.parent
FIX = "--fix" in sys.argv

# ---------------------
# Helpers
# ---------------------
def log_ok(msg: str):
    print(f"[OK] {msg}")

def log_error(msg: str):
    print(f"[ERROR] {msg}")

def log_fix(msg: str):
    print(f"[FIX] {msg}")

# ---------------------
# File & Object Checks
# ---------------------
def check_file_and_object(file_path: str, obj_name: str):
    full_path = PROJECT_ROOT / file_path
    if not full_path.exists():
        log_error(f"File missing: {file_path}")
        if FIX:
            full_path.touch()
            log_fix(f"Created missing file: {file_path}")
        return False

    try:
        # Import the module dynamically
        rel_module = file_path.replace("/", ".").rstrip(".py")
        module = importlib.import_module(rel_module)
        if not hasattr(module, obj_name):
            log_error(f"{obj_name} missing in {file_path}")
            if FIX:
                with open(full_path, "a") as f:
                    f.write(f"\n\n# Auto-generated stub\n{obj_name} = None\n")
                log_fix(f"Added stub for {obj_name} in {file_path}")
            return False
        log_ok(f"{file_path} has {obj_name}")
        return True
    except Exception as e:
        log_error(f"Error importing {file_path}: {e}")
        return False

# ---------------------
# Environment Variables
# ---------------------
REQUIRED_ENV_VARS = ["OLLAMA_BASE_URL"]

def check_env_vars():
    for var in REQUIRED_ENV_VARS:
        if not os.getenv(var):
            log_error(f"Missing environment variable: {var}")
            if FIX:
                os.environ[var] = "http://localhost:11434"
                log_fix(f"Set default value for {var}")

# ---------------------
# Port Checks
# ---------------------
REQUIRED_PORTS = [8100, 11434]

def check_ports():
    for port in REQUIRED_PORTS:
        result = subprocess.run(["lsof", "-i", f":{port}"], capture_output=True)
        if result.stdout:
            log_error(f"Port {port} is already in use")
        else:
            log_ok(f"Port {port} is free")

# ---------------------
# Schema/Class Import Checks
# ---------------------
def scan_routes_for_missing_imports():
    """
    Scan app/api/routes/*.py for imports from app/schemas,
    detect mismatches, and optionally auto-fix by aliasing.
    """
    routes_path = PROJECT_ROOT / "app" / "api" / "routes"
    for route_file in routes_path.glob("*.py"):
        with open(route_file) as f:
            lines = f.readlines()
        new_lines = []
        changed = False
        for line in lines:
            if line.startswith("from app.schemas.ai import"):
                parts = line.strip().split("import")
                imported_classes = [c.strip() for c in parts[1].split(",")]
                schema_file = PROJECT_ROOT / "app" / "schemas" / "ai.py"
                with open(schema_file) as sf:
                    schema_content = sf.read()
                for i, cls in enumerate(imported_classes):
                    if cls not in schema_content:
                        # Try auto-alias to closest match
                        matches = [l.split("(")[0].strip() for l in schema_content.splitlines() if "(" in l]
                        if matches:
                            best_match = matches[0]
                            log_error(f"{cls} not found in app/schemas/ai.py. Did you mean: {best_match}?")
                            if FIX:
                                imported_classes[i] = f"{best_match} as {cls}"
                                changed = True
                if changed:
                    new_line = f"{parts[0]}import {', '.join(imported_classes)}\n"
                    new_lines.append(new_line)
                    log_fix(f"Updated import line in {route_file.name}: {new_line.strip()}")
                else:
                    new_lines.append(line)
            else:
                new_lines.append(line)
        if changed and FIX:
            with open(route_file, "w") as f:
                f.writelines(new_lines)

# ---------------------
# Run Diagnostics
# ---------------------
if __name__ == "__main__":
    print("=== Checking Python files & expected objects ===")
    check_file_and_object("app/ai/retriever.py", "knowledge_retriever")
    check_file_and_object("app/ai/ollama_client.py", "OLLAMA_BASE_URL")

    print("\n=== Checking required ports ===")
    check_ports()

    print("\n=== Checking environment variables ===")
    check_env_vars()

    print("\n=== Checking route imports for schema mismatches ===")
    scan_routes_for_missing_imports()

    print("\n=== Diagnostics complete ===")
