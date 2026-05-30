#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "reports"
OUT.mkdir(exist_ok=True)

TEXT_EXTS = {".py", ".sh", ".yml", ".yaml", ".json", ".md", ".tsx", ".ts", ".js", ".html", ".env", ".txt"}

OBJECTIVES = [
    {
        "area": "Tenant Runtime",
        "goal": "Per-tenant container/runtime is automatically created after signup/payment",
        "must_have": ["docker", "compose", "tenant_slug", "runtime", "deploy"],
        "strong": ["docker compose", "container_name", "subprocess", "flb install-fleetbase", "runtime_id"],
        "bad": ["placeholder", "manual follow-up", "mock", "dummy", "not implemented"],
    },
    {
        "area": "Commercial Flow",
        "goal": "Plan + add-ons + payment creates tenant contract automatically",
        "must_have": ["plan", "addon", "subscription", "payment", "tenant"],
        "strong": ["receipt", "subscription_id", "payment_reference", "signup_session", "finalize"],
        "bad": ["manual approval", "placeholder", "mock", "dummy"],
    },
    {
        "area": "Payment Inheritance",
        "goal": "Tenant websites inherit platform payment rails",
        "must_have": ["paystack", "paypal", "alipay", "wechat", "crypto", "virtual_card"],
        "strong": ["transaction_fee", "payment_method", "tenant_enabled", "settlement"],
        "bad": ["own gateway", "manual setup", "placeholder", "not implemented"],
    },
    {
        "area": "AI Integration",
        "goal": "Ollama AI is connected as selectable add-on and usable by tenants",
        "must_have": ["ollama", "ai", "model", "chat"],
        "strong": ["tenant_ai", "api/v1/ai", "knowledge", "rag", "addon"],
        "bad": ["simulation", "mock", "placeholder"],
    },
    {
        "area": "Vendor Mode",
        "goal": "Drivers/riders/vendors use shared control-plane subscription, no isolated website",
        "must_have": ["vendor", "driver", "rider", "subscription"],
        "strong": ["actor_type", "vendor", "tenant_runtime_included", "website_included"],
        "bad": ["placeholder", "mock"],
    },
    {
        "area": "Admin Console",
        "goal": "Admin observes automation and intervenes only on failure",
        "must_have": ["admin", "event", "audit", "status", "failed"],
        "strong": ["runtime_events", "logs", "retry", "suspend", "revoke"],
        "bad": ["manual approval required", "admin must approve"],
    },
    {
        "area": "Tenant Website",
        "goal": "Freight/shipping tenants get their own website/admin workspace",
        "must_have": ["tenant_url", "subdomain", "website", "domain"],
        "strong": ["custom_domain", "fallback_hostname", "tenant_slug", "runtime_url"],
        "bad": ["shared only", "placeholder"],
    },
    {
        "area": "Fleetbase Engine",
        "goal": "Fleetbase is deployed as real logistics engine, not only referenced",
        "must_have": ["fleetbase", "flb", "install-fleetbase"],
        "strong": ["runner", "install_directory", "health", "runtime"],
        "bad": ["reference only", "mock", "dummy"],
    },
]

def files():
    for p in ROOT.rglob("*"):
        if ".git" in p.parts or "node_modules" in p.parts or "__pycache__" in p.parts:
            continue
        if p.is_file() and p.suffix.lower() in TEXT_EXTS:
            yield p

def read(p: Path) -> str:
    try:
        return p.read_text(errors="ignore")
    except Exception:
        return ""

def hit_score(text: str, terms: list[str]) -> int:
    t = text.lower()
    return sum(1 for x in terms if x.lower() in t)

def find_evidence(term_list, corpus):
    ev = []
    for rel, text in corpus.items():
        low = text.lower()
        for term in term_list:
            if term.lower() in low or term.lower() in rel.lower():
                ev.append(f"{rel} :: {term}")
                break
    return ev[:12]

def classify(must, strong, bad):
    if must >= 3 and strong >= 2 and bad == 0:
        return "REAL_SOFTWARE", "green"
    if must >= 2 and strong >= 1 and bad <= 2:
        return "PARTIAL_ENGINE", "yellow"
    if must >= 1 and bad >= 1:
        return "SCAFFOLD_OR_PLACEHOLDER", "orange"
    return "NOT_PROVEN", "red"

def main():
    corpus = {str(p.relative_to(ROOT)): read(p) for p in files()}
    joined = "\n".join(corpus.values())

    rows = []
    for obj in OBJECTIVES:
        must = hit_score(joined, obj["must_have"])
        strong = hit_score(joined, obj["strong"])
        bad = hit_score(joined, obj["bad"])
        status, color = classify(must, strong, bad)

        rows.append({
            "area": obj["area"],
            "goal": obj["goal"],
            "status": status,
            "color": color,
            "must_score": must,
            "strong_score": strong,
            "risk_score": bad,
            "must_evidence": find_evidence(obj["must_have"], corpus),
            "strong_evidence": find_evidence(obj["strong"], corpus),
            "risk_evidence": find_evidence(obj["bad"], corpus),
        })

    json_path = OUT / "endgoal_gap_audit.json"
    csv_path = OUT / "endgoal_gap_audit.csv"
    md_path = OUT / "endgoal_gap_audit.md"

    json_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "area", "goal", "status", "color", "must_score", "strong_score", "risk_score",
            "must_evidence", "strong_evidence", "risk_evidence"
        ])
        writer.writeheader()
        writer.writerows(rows)

    lines = ["# Afruheritage SaaS Endgoal Gap Audit", ""]
    for r in rows:
        lines.append(f"## {r['area']} — {r['status']}")
        lines.append(f"- Goal: {r['goal']}")
        lines.append(f"- Must score: {r['must_score']}")
        lines.append(f"- Strong score: {r['strong_score']}")
        lines.append(f"- Risk score: {r['risk_score']}")
        lines.append("- Evidence:")
        for ev in r["strong_evidence"][:6]:
            lines.append(f"  - {ev}")
        if r["risk_evidence"]:
            lines.append("- Risks:")
            for ev in r["risk_evidence"][:6]:
                lines.append(f"  - {ev}")
        lines.append("")

    md_path.write_text("\n".join(lines), encoding="utf-8")

    print(f"JSON: {json_path}")
    print(f"CSV:  {csv_path}")
    print(f"MD:   {md_path}")
    print()
    for r in rows:
        print(f"{r['status']:24} | {r['area']}")

if __name__ == "__main__":
    main()
