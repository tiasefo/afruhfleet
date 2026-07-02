import os
import psycopg
from psycopg.rows import dict_row

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://afruheritage:afruheritage@127.0.0.1:5433/afruheritage",
)
TENANT_SLUG = os.getenv("TENANT_SLUG", "amooksco-logistics")

with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
    tenant = conn.execute(
        "SELECT id FROM tenants WHERE slug=%s LIMIT 1",
        (TENANT_SLUG,),
    ).fetchone()
    if not tenant:
        raise SystemExit(f"Tenant not found: {TENANT_SLUG}")

    tenant_id = tenant["id"]

    plan = conn.execute("""
        SELECT code::text AS code
        FROM billing_plans
        ORDER BY
          CASE upper(code::text)
            WHEN 'ENTERPRISE' THEN 1
            WHEN 'BUSINESS' THEN 2
            WHEN 'PRO' THEN 3
            WHEN 'STARTER' THEN 4
            WHEN 'FREE' THEN 5
            ELSE 9
          END,
          code::text
        LIMIT 1
    """).fetchone()

    status = conn.execute("""
        SELECT enumlabel AS status
        FROM pg_enum
        WHERE enumtypid = 'subscriptionstatus'::regtype
        ORDER BY
          CASE upper(enumlabel)
            WHEN 'ACTIVE' THEN 1
            WHEN 'TRIALING' THEN 2
            WHEN 'TRIAL' THEN 3
            ELSE 9
          END,
          enumsortorder
        LIMIT 1
    """).fetchone()

    if not plan:
        raise SystemExit("No billing plan found.")
    if not status:
        raise SystemExit("No subscriptionstatus enum found.")

    plan_code = plan["code"]
    status_value = status["status"]

    print(f"TENANT_ID={tenant_id}")
    print(f"PLAN_CODE={plan_code}")
    print(f"STATUS={status_value}")

    existing = conn.execute("""
        SELECT id, plan_code::text AS plan_code, status::text AS status
        FROM billing_subscriptions
        WHERE tenant_id=%s
        LIMIT 1
    """, (tenant_id,)).fetchone()

    if existing:
        print(f"Existing subscription found: {dict(existing)}")
    else:
        conn.execute("""
            INSERT INTO billing_subscriptions (
                id,
                tenant_id,
                plan_code,
                status,
                currency,
                started_at,
                current_period_end,
                created_at,
                updated_at
            )
            VALUES (
                gen_random_uuid(),
                %s,
                %s::plancode,
                %s::subscriptionstatus,
                'USD',
                now(),
                now() + interval '30 days',
                now(),
                now()
            )
        """, (tenant_id, plan_code, status_value))
        conn.commit()
        print("Inserted billing_subscriptions row")

    rows = conn.execute("""
        SELECT id, tenant_id, plan_code::text, status::text, currency, started_at, current_period_end
        FROM billing_subscriptions
        WHERE tenant_id=%s
    """, (tenant_id,)).fetchall()

    print("VERIFY:")
    for r in rows:
        print(dict(r))
