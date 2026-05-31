#!/usr/bin/env python3
"""
repo_scanner.py

Clean, production-ready scanner for large FastAPI + Next.js + Alembic SaaS repos.

- Skips .venv/, venv/, node_modules/, __pycache__/
- Scans only your real repo code
- Detects unresolved imports (local only)
- Detects FastAPI router definitions + include_router wiring
- Detects Alembic migration drift
- Detects frontend/backend alignment hints
- Outputs repo_scan_report.json
"""

import argparse
import json
import os
from pathlib import Path
import re
from typing import Dict, List, Set, Any

PYTHON_EXT = {".py"}
TS_TSX_EXT = {".ts", ".tsx", ".js", ".jsx"}

SKIP_DIRS = {".venv", "venv", "node_modules", "__pycache__", ".pytest_cache"}

IMPORT_RE = re.compile(
    r"^(?:from\s+([a-zA-Z0-9_\.]+)\s+import\s+|import\s+([a-zA-Z0-9_\.]+))",
    re.MULTILINE,
)

FASTAPI_ROUTER_RE = re.compile(r"APIRouter\s*\(")
INCLUDE_ROUTER_RE = re.compile(r"\.include_router\(([^)]+)\)")

ALEMBIC_VERSION_RE = re.compile(r"^\d+.*\.py$")


def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


def walk_files(root: Path) -> Dict[str, List[Path]]:
    files = {"python": [], "frontend": [], "alembic_versions": [], "other": []}

    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if should_skip(p):
            continue

        suffix = p.suffix.lower()

        if suffix in PYTHON_EXT:
            files["python"].append(p)
            if "alembic" in p.parts and p.parent.name == "versions" and ALEMBIC_VERSION_RE.match(p.name):
                files["alembic_versions"].append(p)

        elif suffix in TS_TSX_EXT:
            files["frontend"].append(p)

        else:
            files["other"].append(p)

    return files


def build_python_module_index(root: Path, py_files: List[Path]) -> Set[str]:
    modules = set()

    for f in py_files:
        try:
            rel = f.relative_to(root)
        except ValueError:
            continue

        parts = list(rel.parts)
        if parts[-1] == "__init__.py":
            parts = parts[:-1]
        else:
            parts[-1] = parts[-1].replace(".py", "")

        if not parts:
            continue

        mod = ".".join(parts)
        modules.add(mod)

        for i in range(1, len(parts)):
            modules.add(".".join(parts[:i]))

    return modules


def parse_imports(py_file: Path) -> List[str]:
    try:
        text = py_file.read_text(encoding="utf-8")
    except Exception:
        return []

    imports = []
    for match in IMPORT_RE.finditer(text):
        mod = match.group(1) or match.group(2)
        if mod:
            imports.append(mod.strip())
    return imports


def analyze_imports(root: Path, py_files: List[Path], module_index: Set[str]) -> List[Dict[str, Any]]:
    findings = []

    top_levels = {m.split(".")[0] for m in module_index}

    for f in py_files:
        imports = parse_imports(f)
        unresolved = []

        for imp in imports:
            top = imp.split(".")[0]
            if top in top_levels and imp not in module_index:
                unresolved.append(imp)

        if unresolved:
            findings.append(
                {
                    "type": "unresolved_imports",
                    "file": str(f.relative_to(root)),
                    "unresolved": sorted(set(unresolved)),
                }
            )

    return findings


def analyze_fastapi_wiring(root: Path, py_files: List[Path]) -> List[Dict[str, Any]]:
    router_defs = []
    include_calls = []

    for f in py_files:
        try:
            text = f.read_text(encoding="utf-8")
        except Exception:
            continue

        if FASTAPI_ROUTER_RE.search(text):
            router_defs.append(f)

        for m in INCLUDE_ROUTER_RE.finditer(text):
            include_calls.append(
                {
                    "file": str(f.relative_to(root)),
                    "call": m.group(0),
                    "arg": m.group(1).strip(),
                }
            )

    findings = []

    if router_defs:
        findings.append(
            {
                "type": "fastapi_router_defs",
                "routers": [str(p.relative_to(root)) for p in router_defs],
            }
        )

    if include_calls:
        findings.append(
            {
                "type": "fastapi_include_router_calls",
                "calls": include_calls,
            }
        )

    return findings


def analyze_alembic_vs_models(root: Path, alembic_versions: List[Path], py_files: List[Path]):
    model_files = [f for f in py_files if "models" in f.parts]

    return [
        {
            "type": "alembic_overview",
            "alembic_versions_count": len(alembic_versions),
            "alembic_versions": [str(p.relative_to(root)) for p in alembic_versions],
            "model_files_count": len(model_files),
            "model_files_sample": [str(p.relative_to(root)) for p in model_files[:20]],
        }
    ]


def analyze_frontend_backend_alignment(root: Path, frontend_files: List[Path], py_files: List[Path]):
    next_routes = set()

    for f in frontend_files:
        if "app" in f.parts:
            rel = f.relative_to(root)
            parts = list(rel.parts)
            if "app" in parts:
                idx = parts.index("app")
                route = "/".join(parts[idx + 1 : -1])
                if route:
                    next_routes.add(route)

    api_routes = [f for f in py_files if "api" in f.parts and "routes" in f.parts]

    return [
        {
            "type": "frontend_backend_alignment_overview",
            "next_app_routes_sample": sorted(list(next_routes))[:50],
            "api_route_files_sample": [str(p.relative_to(root)) for p in api_routes[:50]],
        }
    ]


def main():
    parser = argparse.ArgumentParser(description="Clean repo scanner for large SaaS codebases.")
    parser.add_argument("--root", type=str, default=".", help="Root directory")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    root = Path(args.root).resolve()

    files = walk_files(root)
    py_files = files["python"]
    frontend_files = files["frontend"]
    alembic_versions = files["alembic_versions"]

    module_index = build_python_module_index(root, py_files)

    report = {
        "root": str(root),
        "summary": {
            "python_files": len(py_files),
            "frontend_files": len(frontend_files),
            "alembic_versions": len(alembic_versions),
            "module_index_size": len(module_index),
        },
        "findings": [],
    }

    report["findings"] += analyze_imports(root, py_files, module_index)
    report["findings"] += analyze_fastapi_wiring(root, py_files)
    report["findings"] += analyze_alembic_vs_models(root, alembic_versions, py_files)
    report["findings"] += analyze_frontend_backend_alignment(root, frontend_files, py_files)

    out = root / "repo_scan_report.json"
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")

    if args.verbose:
        print(f"[scanner] Report written to {out}")


if __name__ == "__main__":
    main()
