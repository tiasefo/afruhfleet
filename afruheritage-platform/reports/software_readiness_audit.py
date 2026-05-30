#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "reports"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

HTML_OUT = OUTPUT_DIR / "software_readiness_audit.html"
CSV_OUT = OUTPUT_DIR / "software_readiness_audit.csv"
JSON_OUT = OUTPUT_DIR / "software_readiness_audit.json"

TEXT_EXTS = {
    ".py", ".js", ".ts", ".tsx", ".html", ".css", ".md", ".txt",
    ".json", ".yaml", ".yml", ".sh", ".env", ".conf", ".template"
}

SEARCH_DIRS = [
    ROOT / "app",
    ROOT / "docs",
    ROOT / "infra",
    ROOT / "scripts",
]

FRONTEND_HINT_DIRS = [
    ROOT / "app" / "static",
    ROOT / "app" / "templates",
    ROOT / "frontend",
    ROOT / "web",
    ROOT / "ui",
]

MOCK_PATTERNS = [
    r"\bmock\b",
    r"\bdummy\b",
    r"\bsimulat(e|ion|ed)\b",
    r"\bplaceholder\b",
    r"\bcoming soon\b",
    r"\bstub\b",
    r"\bexample only\b",
    r"\bfake\b",
    r"\btest data\b",
    r"\bhardcoded\b",
    r"\bnot implemented\b",
    r"\bto do\b",
    r"\bTODO\b",
    r"\bFIXME\b",
    r"00000000-0000-0000-0000-000000000000",
    r"11111111-1111-1111-1111-111111111111",
]

STATIC_SUCCESS_PATTERNS = [
    r'return\s+\{\s*"status"\s*:\s*"success"\s*\}',
    r'return\s+\{\s*"status"\s*:\s*"ok"\s*\}',
    r'return\s+\{\s*"message"\s*:\s*"success"\s*\}',
    r'return\s+\[\s*\]',
]

SCAFFOLD_PATTERNS = [
    r"\bscaffold\b",
    r"\bfoundation\b",
    r"\bmanual follow-up\b",
    r"\bplaceholder fallback\b",
    r"\bfirst implementation\b",
    r"\bTODO\b",
]

IMPLEMENTATION_HINTS = [
    r"create_engine\(",
    r"sessionmaker\(",
    r"mapped_column\(",
    r"APIRouter\(",
    r"@router\.(get|post|put|delete|patch)",
    r"subprocess\.run",
    r"httpx\.(Client|get|post)",
    r"ssh ",
    r"docker compose",
    r"flb install-fleetbase",
]

REALISM_NEGATIVE_PATTERNS = [
    r"return None",
    r"pass\s*$",
    r"raise NotImplementedError",
    r"except Exception as exc:",
]

@dataclass
class Capability:
    name: str
    group: str
    route_signals: list[str] = field(default_factory=list)
    model_signals: list[str] = field(default_factory=list)
    service_signals: list[str] = field(default_factory=list)
    frontend_signals: list[str] = field(default_factory=list)
    doc_signals: list[str] = field(default_factory=list)


CAPABILITIES: list[Capability] = [
    Capability(
        name="Auth bootstrap and login",
        group="Core",
        route_signals=["/api/v1/auth/bootstrap", "/api/v1/auth/login", "app/api/routes/auth.py"],
        model_signals=["app/models/user.py"],
        service_signals=["password", "bcrypt", "passlib"],
        frontend_signals=["login", "auth"],
        doc_signals=["bootstrap admin", "login"],
    ),
    Capability(
        name="Tenant lifecycle",
        group="Core",
        route_signals=["/api/v1/tenants", "app/api/routes/tenants.py"],
        model_signals=["app/models/tenant.py"],
        service_signals=["approve", "tenant", "provision"],
        frontend_signals=["tenant", "tenants"],
        doc_signals=["tenant", "approval"],
    ),
    Capability(
        name="AI chat",
        group="AI",
        route_signals=["/api/v1/ai/chat", "app/api/routes/ai.py"],
        model_signals=["tenant_ai_settings", "app/models/tenant_ai_settings.py"],
        service_signals=["ollama", "retriever", "search_knowledge", "chat_with_ollama"],
        frontend_signals=["embed.js", "afruheritage-ai-widget", "api/v1/ai/chat"],
        doc_signals=["AI Widget Integration"],
    ),
    Capability(
        name="Billing and plans",
        group="Billing",
        route_signals=["/api/v1/billing/plans", "/api/v1/billing/subscriptions", "app/api/routes/billing.py"],
        model_signals=["billing_plans", "billing_subscriptions", "billing_wallets", "app/models/billing.py"],
        service_signals=["paystack", "create_trial_subscription", "activate_or_upgrade_subscription"],
        frontend_signals=["wallet", "billing", "subscription", "plans"],
        doc_signals=["Billing & Subscription Integration Guide"],
    ),
    Capability(
        name="Public support intake",
        group="Support",
        route_signals=["/api/v1/support-crm/public/tickets", "app/api/routes/support_crm.py"],
        model_signals=["support_tickets", "support_ticket_messages", "app/models/support_crm.py"],
        service_signals=["create_public_ticket", "sync_ticket_to_glpi", "glpi_client"],
        frontend_signals=["support", "ticket", "public/tickets"],
        doc_signals=["Support + GLPI + CRM Integration Guide"],
    ),
    Capability(
        name="CRM accounts contacts opportunities quotes",
        group="CRM",
        route_signals=["/api/v1/support-crm/accounts", "/api/v1/support-crm/opportunities", "/api/v1/support-crm/quotes"],
        model_signals=["crm_accounts", "crm_contacts", "crm_opportunities", "crm_quotes"],
        service_signals=["create_crm_account", "create_opportunity", "create_quote"],
        frontend_signals=["crm", "quotes", "opportunity"],
        doc_signals=["crm"],
    ),
    Capability(
        name="Custom domains",
        group="Domains",
        route_signals=["/api/v1/domains/request", "/api/v1/domains/activate", "app/api/routes/custom_domains.py"],
        model_signals=["custom_domains", "tenant_domain_settings", "app/models/custom_domains.py"],
        service_signals=["CloudflareDomainClient", "request_custom_domain", "create_custom_hostname"],
        frontend_signals=["domain", "dns"],
        doc_signals=["Custom Domain Integration Guide"],
    ),
    Capability(
        name="Fleetbase runtime orchestration",
        group="Fleetbase Runtime",
        route_signals=["/api/v1/fleetbase-runtime", "app/api/routes/fleetbase_runtime.py"],
        model_signals=["fleetbase_runtimes", "fleetbase_runner_nodes", "app/models/fleetbase_runtime.py"],
        service_signals=["RunnerExecutor", "run_install", "flb install-fleetbase", "ssh"],
        frontend_signals=["fleetbase-runtime", "runner"],
        doc_signals=["Fleetbase Runtime Deployer Guide"],
    ),
    Capability(
        name="Fleetbase operational engine usage",
        group="Fleetbase Engine",
        route_signals=["orders", "drivers", "vehicles", "dispatch", "tracking"],
        model_signals=["fleetbase"],
        service_signals=["@fleetbase/cli", "flb", "install-fleetbase"],
        frontend_signals=["orders", "drivers", "vehicles", "dispatch", "tracking"],
        doc_signals=["fleetbase"],
    ),
]


def iter_text_files() -> Iterable[Path]:
    for base in SEARCH_DIRS:
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if p.is_file() and p.suffix.lower() in TEXT_EXTS:
                yield p


def safe_read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def load_corpus() -> dict[str, str]:
    data = {}
    for path in iter_text_files():
        data[str(path.relative_to(ROOT))] = safe_read(path)
    return data


def is_frontend_path(rel: str) -> bool:
    full = ROOT / rel
    if any(str(full).startswith(str(d)) for d in FRONTEND_HINT_DIRS if d.exists()):
        return True
    return rel.endswith((".js", ".ts", ".tsx", ".html", ".css"))


def find_hits(corpus: dict[str, str], signals: list[str], frontend_only: bool = False) -> list[str]:
    hits = []
    for rel, content in corpus.items():
        if frontend_only and not is_frontend_path(rel):
            continue
        text = content.lower()
        for signal in signals:
            if signal.lower() in rel.lower() or signal.lower() in text:
                hits.append(f"{rel} :: {signal}")
                break
    return hits


def regex_count(text: str, patterns: list[str]) -> int:
    count = 0
    for pat in patterns:
        count += len(re.findall(pat, text, flags=re.IGNORECASE | re.MULTILINE))
    return count


def collect_global_signals(corpus: dict[str, str]) -> dict[str, list[str]]:
    by_file = {}
    for rel, content in corpus.items():
        markers = []
        for pat in MOCK_PATTERNS:
            if re.search(pat, content, flags=re.IGNORECASE):
                markers.append(f"mock:{pat}")
        for pat in STATIC_SUCCESS_PATTERNS:
            if re.search(pat, content, flags=re.IGNORECASE | re.MULTILINE):
                markers.append(f"static_success:{pat}")
        for pat in SCAFFOLD_PATTERNS:
            if re.search(pat, content, flags=re.IGNORECASE):
                markers.append(f"scaffold:{pat}")
        for pat in REALISM_NEGATIVE_PATTERNS:
            if re.search(pat, content, flags=re.IGNORECASE | re.MULTILINE):
                markers.append(f"negative:{pat}")
        if markers:
            by_file[rel] = markers
    return by_file


def score_capability(cap: Capability, corpus: dict[str, str], suspicious: dict[str, list[str]]) -> dict:
    route_hits = find_hits(corpus, cap.route_signals, frontend_only=False)
    model_hits = find_hits(corpus, cap.model_signals, frontend_only=False)
    service_hits = find_hits(corpus, cap.service_signals, frontend_only=False)
    frontend_hits = find_hits(corpus, cap.frontend_signals, frontend_only=True)
    doc_hits = find_hits(corpus, cap.doc_signals, frontend_only=False)

    evidence_files = set()
    for arr in (route_hits, model_hits, service_hits, frontend_hits, doc_hits):
        for hit in arr:
            evidence_files.add(hit.split(" :: ")[0])

    suspicious_hits = []
    for rel in sorted(evidence_files):
        suspicious_hits.extend([f"{rel} :: {m}" for m in suspicious.get(rel, [])])

    backend_present = bool(route_hits or model_hits or service_hits)
    frontend_present = bool(frontend_hits)
    docs_present = bool(doc_hits)

    implementation_strength = 0
    implementation_strength += len(route_hits) * 3
    implementation_strength += len(model_hits) * 2
    implementation_strength += len(service_hits) * 3
    implementation_strength += len(frontend_hits) * 2
    implementation_strength += len(doc_hits)

    penalty = 0
    penalty += len(suspicious_hits) * 2

    net = implementation_strength - penalty

    if backend_present and frontend_present and net >= 6 and len(suspicious_hits) <= 2:
        status = "Functional software"
        color = "green"
    elif backend_present and net >= 4 and len(suspicious_hits) <= 4:
        status = "Partial / backend-led"
        color = "yellow"
    elif backend_present and len(suspicious_hits) > 0:
        status = "Scaffold / placeholder risk"
        color = "orange"
    elif docs_present and not backend_present:
        status = "Referenced only"
        color = "gray"
    else:
        status = "Mock / simulation / non-functional"
        color = "red"

    return {
        "group": cap.group,
        "capability": cap.name,
        "backend_present": backend_present,
        "frontend_present": frontend_present,
        "docs_present": docs_present,
        "status": status,
        "color": color,
        "implementation_strength": implementation_strength,
        "penalty": penalty,
        "net_score": net,
        "route_hits": route_hits[:10],
        "model_hits": model_hits[:10],
        "service_hits": service_hits[:10],
        "frontend_hits": frontend_hits[:10],
        "doc_hits": doc_hits[:10],
        "suspicious_hits": suspicious_hits[:20],
    }


def html_report(rows: list[dict]) -> str:
    colors = {
        "green": "#dcfce7",
        "yellow": "#fef9c3",
        "orange": "#fed7aa",
        "red": "#fecaca",
        "gray": "#e5e7eb",
    }

    def esc(x: str) -> str:
        return (
            x.replace("&", "&amp;")
             .replace("<", "&lt;")
             .replace(">", "&gt;")
        )

    trs = []
    for r in rows:
        evidence = []
        if r["route_hits"]:
            evidence.append("Routes:\n- " + "\n- ".join(r["route_hits"]))
        if r["model_hits"]:
            evidence.append("Models:\n- " + "\n- ".join(r["model_hits"]))
        if r["service_hits"]:
            evidence.append("Services:\n- " + "\n- ".join(r["service_hits"]))
        if r["frontend_hits"]:
            evidence.append("Frontend:\n- " + "\n- ".join(r["frontend_hits"]))
        if r["doc_hits"]:
            evidence.append("Docs:\n- " + "\n- ".join(r["doc_hits"]))
        if r["suspicious_hits"]:
            evidence.append("Suspicious:\n- " + "\n- ".join(r["suspicious_hits"]))

        trs.append(f"""
        <tr style="background:{colors[r['color']]}">
          <td>{esc(r['group'])}</td>
          <td>{esc(r['capability'])}</td>
          <td>{'Yes' if r['backend_present'] else 'No'}</td>
          <td>{'Yes' if r['frontend_present'] else 'No'}</td>
          <td>{'Yes' if r['docs_present'] else 'No'}</td>
          <td><strong>{esc(r['status'])}</strong></td>
          <td>{r['implementation_strength']}</td>
          <td>{r['penalty']}</td>
          <td>{r['net_score']}</td>
          <td><details><summary>Open</summary><pre>{esc(chr(10).join(evidence) if evidence else 'No evidence')}</pre></details></td>
        </tr>
        """)

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Software Readiness Audit</title>
<style>
body {{
  font-family: Arial, sans-serif;
  background: #f8fafc;
  color: #0f172a;
  margin: 24px;
}}
table {{
  width: 100%;
  border-collapse: collapse;
  background: white;
}}
th, td {{
  border: 1px solid #e2e8f0;
  padding: 10px;
  vertical-align: top;
  text-align: left;
  font-size: 14px;
}}
th {{
  background: #0f172a;
  color: white;
}}
pre {{
  white-space: pre-wrap;
  font-size: 12px;
}}
.legend span {{
  display: inline-block;
  margin-right: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
}}
</style>
</head>
<body>
<h1>Software Readiness Audit</h1>
<p>Target: distinguish functioning software from scaffold / mock / simulation / reference-only code.</p>
<div class="legend">
  <span style="background:#dcfce7;">Functional software</span>
  <span style="background:#fef9c3;">Partial / backend-led</span>
  <span style="background:#fed7aa;">Scaffold / placeholder risk</span>
  <span style="background:#fecaca;">Mock / simulation / non-functional</span>
  <span style="background:#e5e7eb;">Referenced only</span>
</div>
<table>
<thead>
<tr>
  <th>Group</th>
  <th>Capability</th>
  <th>Backend</th>
  <th>Frontend</th>
  <th>Docs</th>
  <th>Status</th>
  <th>Impl</th>
  <th>Penalty</th>
  <th>Net</th>
  <th>Evidence</th>
</tr>
</thead>
<tbody>
{''.join(trs)}
</tbody>
</table>
</body>
</html>"""


def main() -> None:
    corpus = load_corpus()
    suspicious = collect_global_signals(corpus)

    rows = [score_capability(cap, corpus, suspicious) for cap in CAPABILITIES]
    rows.sort(key=lambda r: (r["group"], r["capability"]))

    with CSV_OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "group", "capability", "backend_present", "frontend_present",
                "docs_present", "status", "color", "implementation_strength",
                "penalty", "net_score", "route_hits", "model_hits",
                "service_hits", "frontend_hits", "doc_hits", "suspicious_hits",
            ],
            extrasaction="ignore",
        )
        writer.writeheader()
        writer.writerows(rows)

    JSON_OUT.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    HTML_OUT.write_text(html_report(rows), encoding="utf-8")

    print(f"HTML report: {HTML_OUT}")
    print(f"CSV report:  {CSV_OUT}")
    print(f"JSON report: {JSON_OUT}")
    print()

    summary = {}
    for row in rows:
        summary[row["status"]] = summary.get(row["status"], 0) + 1

    print("Summary:")
    for k, v in sorted(summary.items()):
        print(f"  {k}: {v}")

    print("\nHighest-risk items:")
    ranked = sorted(rows, key=lambda r: (r["status"] != "Mock / simulation / non-functional", r["net_score"]))
    for row in ranked[:10]:
        print(f"  - [{row['group']}] {row['capability']} -> {row['status']} (net={row['net_score']})")


if __name__ == "__main__":
    main()
