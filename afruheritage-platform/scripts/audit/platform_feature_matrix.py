#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[2]

SEARCH_DIRS = [
    ROOT / "app",
    ROOT / "docs",
    ROOT / "infra",
    ROOT / "scripts",
]

FRONTEND_DIR_HINTS = [
    ROOT / "app" / "static",
    ROOT / "app" / "templates",
    ROOT / "frontend",
    ROOT / "web",
    ROOT / "ui",
]

OUTPUT_DIR = ROOT / "reports"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

HTML_OUT = OUTPUT_DIR / "platform_feature_matrix.html"
CSV_OUT = OUTPUT_DIR / "platform_feature_matrix.csv"
JSON_OUT = OUTPUT_DIR / "platform_feature_matrix.json"


@dataclass
class Feature:
    name: str
    group: str
    source: str  # in_house | fleetbase
    backend_signals: list[str] = field(default_factory=list)
    frontend_signals: list[str] = field(default_factory=list)
    notes: str = ""
    currently_used_expected: bool = True


FEATURES: list[Feature] = [
    Feature(
        name="Authentication & Admin Bootstrap",
        group="Core Platform",
        source="in_house",
        backend_signals=[
            "/api/v1/auth/bootstrap",
            "/api/v1/auth/login",
            "app/api/routes/auth.py",
        ],
        frontend_signals=[
            "auth/login",
            "bootstrap_admin.sh",
            "login",
        ],
        notes="Admin bootstrap and login flow.",
    ),
    Feature(
        name="Tenant Management",
        group="Core Platform",
        source="in_house",
        backend_signals=[
            "/api/v1/tenants",
            "app/api/routes/tenants.py",
            "tenant",
        ],
        frontend_signals=[
            "tenant",
            "tenants",
        ],
        notes="Tenant CRUD, approval, lifecycle.",
    ),
    Feature(
        name="AI Chat API",
        group="AI",
        source="in_house",
        backend_signals=[
            "/api/v1/ai/chat",
            "app/api/routes/ai.py",
            "app/ai/retriever.py",
            "app/ai/ollama_client.py",
        ],
        frontend_signals=[
            "/static/widget/embed.js",
            "api/v1/ai/chat",
            "afruheritage-ai-widget",
        ],
        notes="RAG-backed chat endpoint.",
    ),
    Feature(
        name="Floating AI Widget",
        group="AI",
        source="in_house",
        backend_signals=[
            "/api/v1/ai/widget/config",
            "app/api/routes/ai_widget.py",
        ],
        frontend_signals=[
            "app/static/widget/embed.js",
            "afruheritage-ai-toggle",
            "afruheritage-ai-panel",
        ],
        notes="Floating chatbot for control plane and tenant pages.",
    ),
    Feature(
        name="Billing Plans",
        group="Billing",
        source="in_house",
        backend_signals=[
            "/api/v1/billing/plans",
            "app/api/routes/billing.py",
            "billing_plans",
        ],
        frontend_signals=[
            "billing",
            "plans",
            "subscription",
        ],
        notes="Plan catalog: free_trial, professional, business.",
    ),
    Feature(
        name="Subscriptions",
        group="Billing",
        source="in_house",
        backend_signals=[
            "/api/v1/billing/subscriptions",
            "billing_subscriptions",
            "create_trial_subscription",
        ],
        frontend_signals=[
            "subscription",
            "trial",
            "plan",
        ],
        notes="Trial, activation, read-only enforcement foundation.",
    ),
    Feature(
        name="Credit Wallet",
        group="Billing",
        source="in_house",
        backend_signals=[
            "billing_wallets",
            "billing_wallet_transactions",
            "/api/v1/billing/wallets",
            "/api/v1/billing/credits/consume",
        ],
        frontend_signals=[
            "wallet",
            "credits",
        ],
        notes="Credits for AI usage and document processing.",
    ),
    Feature(
        name="Paystack Payment Integration",
        group="Billing",
        source="in_house",
        backend_signals=[
            "PAYSTACK_SECRET_KEY",
            "app/services/paystack_client.py",
            "/api/v1/billing/payments/init",
            "/api/v1/billing/payments/verify",
        ],
        frontend_signals=[
            "payments",
            "billing",
        ],
        notes="Backend-only payment initialization and verification.",
    ),
    Feature(
        name="CRM Accounts & Contacts",
        group="CRM",
        source="in_house",
        backend_signals=[
            "crm_accounts",
            "crm_contacts",
            "/api/v1/support-crm/accounts",
            "/api/v1/support-crm/contacts",
        ],
        frontend_signals=[
            "account",
            "contact",
            "crm",
        ],
        notes="Tenant CRM base.",
    ),
    Feature(
        name="Opportunities",
        group="CRM",
        source="in_house",
        backend_signals=[
            "crm_opportunities",
            "/api/v1/support-crm/opportunities",
        ],
        frontend_signals=[
            "opportunity",
            "crm",
        ],
        notes="Sales pipeline foundation.",
    ),
    Feature(
        name="Quotes",
        group="CRM",
        source="in_house",
        backend_signals=[
            "crm_quotes",
            "/api/v1/support-crm/quotes",
        ],
        frontend_signals=[
            "quote",
            "quotes",
        ],
        notes="Quote generation foundation.",
    ),
    Feature(
        name="Public Support Ticket Intake",
        group="Support",
        source="in_house",
        backend_signals=[
            "/api/v1/support-crm/public/tickets",
            "support_tickets",
            "public_token",
        ],
        frontend_signals=[
            "ticket",
            "support",
            "public/tickets",
        ],
        notes="Customers can create tickets without login.",
    ),
    Feature(
        name="GLPI Sync",
        group="Support",
        source="in_house",
        backend_signals=[
            "app/services/glpi_client.py",
            "support_sync_logs",
            "GLPI_BASE_URL",
        ],
        frontend_signals=[
            "support",
        ],
        notes="Shared GLPI backend with tenant separation.",
    ),
    Feature(
        name="Custom Domain Requests",
        group="Domains",
        source="in_house",
        backend_signals=[
            "/api/v1/domains/request",
            "custom_domains",
            "app/api/routes/custom_domains.py",
        ],
        frontend_signals=[
            "domain",
            "custom domain",
        ],
        notes="Customer subdomain/apex domain foundation.",
    ),
    Feature(
        name="Cloudflare Domain Integration",
        group="Domains",
        source="in_house",
        backend_signals=[
            "app/services/cloudflare_domains.py",
            "CLOUDFLARE_API_TOKEN",
            "custom_hostnames",
        ],
        frontend_signals=[
            "domain",
            "dns",
        ],
        notes="Cloudflare for SaaS style hostname orchestration.",
    ),
    Feature(
        name="Fleetbase Runtime Orchestration",
        group="Fleetbase Runtime",
        source="in_house",
        backend_signals=[
            "/api/v1/fleetbase-runtime",
            "app/api/routes/fleetbase_runtime.py",
            "app/services/fleetbase_runtime_service.py",
            "RunnerExecutor",
        ],
        frontend_signals=[
            "fleetbase-runtime",
            "runner",
        ],
        notes="Runner registration and install orchestration layer.",
    ),
    Feature(
        name="Fleetbase Orders",
        group="Fleetbase Engine",
        source="fleetbase",
        backend_signals=[
            "order",
            "orders",
            "fleetbase",
        ],
        frontend_signals=[
            "orders",
            "dispatch",
        ],
        notes="Operational order lifecycle from Fleetbase engine.",
        currently_used_expected=False,
    ),
    Feature(
        name="Fleetbase Drivers",
        group="Fleetbase Engine",
        source="fleetbase",
        backend_signals=[
            "driver",
            "drivers",
            "fleetbase",
        ],
        frontend_signals=[
            "driver",
            "drivers",
        ],
        notes="Driver management capability from Fleetbase.",
        currently_used_expected=False,
    ),
    Feature(
        name="Fleetbase Vehicles",
        group="Fleetbase Engine",
        source="fleetbase",
        backend_signals=[
            "vehicle",
            "vehicles",
            "fleetbase",
        ],
        frontend_signals=[
            "vehicle",
            "vehicles",
        ],
        notes="Vehicle management capability from Fleetbase.",
        currently_used_expected=False,
    ),
    Feature(
        name="Fleetbase Dispatch Dashboard",
        group="Fleetbase Engine",
        source="fleetbase",
        backend_signals=[
            "dispatch",
            "fleetbase",
        ],
        frontend_signals=[
            "dispatch",
            "console",
        ],
        notes="Dispatch and operations console via Fleetbase.",
        currently_used_expected=False,
    ),
    Feature(
        name="Fleetbase Real-time Tracking",
        group="Fleetbase Engine",
        source="fleetbase",
        backend_signals=[
            "tracking",
            "socket",
            "webhook",
            "fleetbase",
        ],
        frontend_signals=[
            "tracking",
            "map",
        ],
        notes="Native Fleetbase operational tracking capability.",
        currently_used_expected=False,
    ),
    Feature(
        name="Fleetbase Contacts / Entities",
        group="Fleetbase Engine",
        source="fleetbase",
        backend_signals=[
            "contacts",
            "entity",
            "fleetbase",
        ],
        frontend_signals=[
            "contacts",
            "entities",
        ],
        notes="Potential Fleetbase data objects not yet visibly wired.",
        currently_used_expected=False,
    ),
    Feature(
        name="Fleetbase Extensions / CLI Install",
        group="Fleetbase Engine",
        source="fleetbase",
        backend_signals=[
            "@fleetbase/cli",
            "flb install-fleetbase",
            "install-fleetbase",
        ],
        frontend_signals=[],
        notes="CLI/runtime installation capability.",
    ),
    Feature(
        name="Tracking Engine (CSV / Customer Mapping)",
        group="Tracking",
        source="in_house",
        backend_signals=[
            "tracking",
            "csv",
            "shipment",
            "container",
        ],
        frontend_signals=[
            "tracking",
            "csv",
            "shipment",
        ],
        notes="Desired next module; likely not scaffolded yet.",
        currently_used_expected=False,
    ),
]


TEXT_EXTS = {
    ".py", ".md", ".txt", ".json", ".yaml", ".yml", ".html", ".js", ".ts", ".tsx",
    ".css", ".conf", ".template", ".env", ".sh"
}


def iter_text_files() -> Iterable[Path]:
    for base in SEARCH_DIRS:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.is_file() and path.suffix.lower() in TEXT_EXTS:
                yield path


def safe_read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def collect_corpus() -> dict[str, str]:
    corpus = {}
    for path in iter_text_files():
        corpus[str(path.relative_to(ROOT))] = safe_read(path)
    return corpus


def search_signals(corpus: dict[str, str], signals: list[str], frontend_only: bool = False) -> list[str]:
    matches: list[str] = []
    for rel_path, content in corpus.items():
        if frontend_only:
            rel_obj = ROOT / rel_path
            if not any(str(rel_obj).startswith(str(d)) for d in FRONTEND_DIR_HINTS if d.exists()):
                # also allow JS/template-ish files anywhere
                if not rel_path.endswith((".js", ".ts", ".tsx", ".html", ".css")):
                    continue

        lowered = content.lower()
        for signal in signals:
            if signal.lower() in lowered or signal.lower() in rel_path.lower():
                matches.append(f"{rel_path} :: {signal}")
                break
    return matches


def classify(backend_hits: list[str], frontend_hits: list[str], source: str, expected: bool) -> tuple[str, str]:
    backend = bool(backend_hits)
    frontend = bool(frontend_hits)

    if backend and frontend:
        return "Aligned", "green"
    if backend and not frontend:
        return "Backend only", "yellow"
    if not backend and frontend:
        return "Frontend only", "orange"
    if source == "fleetbase" and not expected and not backend and not frontend:
        return "Fleetbase capability not used", "gray"
    return "Missing / not implemented", "red"


def make_html(rows: list[dict]) -> str:
    color_map = {
        "green": "#dcfce7",
        "yellow": "#fef9c3",
        "orange": "#fed7aa",
        "red": "#fecaca",
        "gray": "#e5e7eb",
    }

    legend = """
    <div class="legend">
      <span class="pill green">Aligned</span>
      <span class="pill yellow">Backend only</span>
      <span class="pill orange">Frontend only</span>
      <span class="pill red">Missing / not implemented</span>
      <span class="pill gray">Fleetbase capability not used</span>
    </div>
    """

    trs = []
    for row in rows:
        bg = color_map[row["color"]]
        trs.append(
            f"""
            <tr style="background:{bg}">
              <td>{html.escape(row["group"])}</td>
              <td>{html.escape(row["feature"])}</td>
              <td>{html.escape(row["source"])}</td>
              <td>{'Yes' if row["backend_present"] else 'No'}</td>
              <td>{'Yes' if row["frontend_present"] else 'No'}</td>
              <td><strong>{html.escape(row["status"])}</strong></td>
              <td>{html.escape(row["unused_flag"])}</td>
              <td><details><summary>Evidence</summary><pre>{html.escape(row["evidence"])}</pre></details></td>
              <td>{html.escape(row["notes"])}</td>
            </tr>
            """
        )

    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Afruheritage Platform Feature Matrix</title>
  <style>
    body {{
      font-family: Arial, sans-serif;
      margin: 24px;
      background: #f8fafc;
      color: #0f172a;
    }}
    h1 {{ margin-bottom: 8px; }}
    .meta {{ margin-bottom: 16px; color: #475569; }}
    table {{
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 6px 18px rgba(0,0,0,.06);
    }}
    th, td {{
      border: 1px solid #e2e8f0;
      padding: 10px;
      text-align: left;
      vertical-align: top;
      font-size: 14px;
    }}
    th {{
      background: #0f172a;
      color: white;
      position: sticky;
      top: 0;
    }}
    .legend {{
      display: flex;
      gap: 10px;
      margin: 16px 0 20px;
      flex-wrap: wrap;
    }}
    .pill {{
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      border: 1px solid #cbd5e1;
    }}
    .green {{ background: #dcfce7; }}
    .yellow {{ background: #fef9c3; }}
    .orange {{ background: #fed7aa; }}
    .red {{ background: #fecaca; }}
    .gray {{ background: #e5e7eb; }}
    pre {{
      white-space: pre-wrap;
      word-break: break-word;
      margin: 8px 0 0;
      font-size: 12px;
    }}
  </style>
</head>
<body>
  <h1>Afruheritage Platform Feature Matrix</h1>
  <div class="meta">Generated from codebase scan at: {html.escape(str(ROOT))}</div>
  {legend}
  <table>
    <thead>
      <tr>
        <th>Group</th>
        <th>Feature</th>
        <th>Source</th>
        <th>Backend</th>
        <th>Frontend</th>
        <th>Status</th>
        <th>Unused Fleetbase</th>
        <th>Evidence</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      {''.join(trs)}
    </tbody>
  </table>
</body>
</html>
"""


def main() -> None:
    corpus = collect_corpus()
    rows: list[dict] = []

    for feature in FEATURES:
        backend_hits = search_signals(corpus, feature.backend_signals, frontend_only=False)
        frontend_hits = search_signals(corpus, feature.frontend_signals, frontend_only=True)

        status, color = classify(
            backend_hits=backend_hits,
            frontend_hits=frontend_hits,
            source=feature.source,
            expected=feature.currently_used_expected,
        )

        unused_flag = "Yes" if (feature.source == "fleetbase" and status == "Fleetbase capability not used") else "No"

        evidence_lines = []
        if backend_hits:
            evidence_lines.append("Backend:\n- " + "\n- ".join(backend_hits[:10]))
        if frontend_hits:
            evidence_lines.append("Frontend:\n- " + "\n- ".join(frontend_hits[:10]))
        if not evidence_lines:
            evidence_lines.append("No matching signals found in scanned files.")

        rows.append(
            {
                "group": feature.group,
                "feature": feature.name,
                "source": feature.source,
                "backend_present": bool(backend_hits),
                "frontend_present": bool(frontend_hits),
                "status": status,
                "color": color,
                "unused_flag": unused_flag,
                "evidence": "\n\n".join(evidence_lines),
                "notes": feature.notes,
            }
        )

    rows.sort(key=lambda r: (r["group"], r["source"], r["feature"]))

    with CSV_OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "group", "feature", "source", "backend_present", "frontend_present",
                "status", "color", "unused_flag", "notes", "evidence"
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    JSON_OUT.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    HTML_OUT.write_text(make_html(rows), encoding="utf-8")

    print(f"HTML report: {HTML_OUT}")
    print(f"CSV report:  {CSV_OUT}")
    print(f"JSON report: {JSON_OUT}")
    print()

    by_status: dict[str, int] = {}
    for row in rows:
        by_status[row["status"]] = by_status.get(row["status"], 0) + 1

    print("Summary:")
    for status, count in sorted(by_status.items()):
        print(f"  {status}: {count}")

    print("\nTop misalignment candidates:")
    for row in rows:
        if row["status"] in {"Backend only", "Frontend only", "Missing / not implemented"}:
            print(f"  - [{row['group']}] {row['feature']} -> {row['status']}")


if __name__ == "__main__":
    main()
