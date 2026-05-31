#!/usr/bin/env python
import ast
import os
from pathlib import Path

ROUTES_ROOT = Path("afruheritage-platform/app/api/routes")
ENFORCE_PATH_PARAM = False  # set True if you want /{tenant_id}/ in every path

def has_tenant_in_args(fn: ast.FunctionDef) -> bool:
    for arg in fn.args.args:
        if arg.arg == "tenant_id":
            return True
    return False

def add_tenant_arg(fn: ast.FunctionDef) -> None:
    if has_tenant_in_args(fn):
        return
    new_arg = ast.arg(arg="tenant_id", annotation=ast.Name(id="str"))
    fn.args.args.insert(0, new_arg)

def patch_file(path: Path) -> bool:
    src = path.read_text(encoding="utf-8")
    tree = ast.parse(src)
    modified = False

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            # crude heuristic: only patch functions decorated with router/app HTTP decorators
            if not node.decorator_list:
                continue
            if not any(
                isinstance(d, ast.Call)
                and isinstance(d.func, ast.Attribute)
                and d.func.attr in {"get", "post", "put", "delete", "patch"}
                for d in node.decorator_list
            ):
                continue

            if not has_tenant_in_args(node):
                add_tenant_arg(node)
                modified = True

            if ENFORCE_PATH_PARAM:
                for d in node.decorator_list:
                    if isinstance(d, ast.Call) and d.args:
                        arg0 = d.args[0]
                        if isinstance(arg0, ast.Constant) and isinstance(arg0.value, str):
                            if "{tenant_id}" not in arg0.value:
                                arg0.value = "/{tenant_id}" + arg0.value
                                modified = True

    if modified:
        new_src = ast.unparse(tree)
        path.write_text(new_src, encoding="utf-8")
    return modified

def main():
    patched = []
    for py in ROUTES_ROOT.rglob("*.py"):
        if "test" in py.name:
            continue
        if patch_file(py):
            patched.append(str(py))

    print("Patched multi-tenant routes:")
    for p in patched:
        print("  -", p)

if __name__ == "__main__":
    main()
