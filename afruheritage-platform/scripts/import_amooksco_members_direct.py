import csv, re, uuid
from pathlib import Path
import psycopg

DB="postgresql://afruheritage:afruheritage@127.0.0.1:5433/afruheritage"
CSV=Path("data/tenants/amooksco/imports/customers/amooksco_members_normalized_for_bulk_import.csv")

def norm_phone(v):
    digits=re.sub(r"\D+","",v or "")
    return digits

def norm_name(v):
    return re.sub(r"\s+"," ",(v or "").strip()).upper()

with psycopg.connect(DB) as conn:
    tenant=conn.execute("SELECT id FROM tenants WHERE slug='amooksco-logistics'").fetchone()
    if not tenant:
        raise SystemExit("Amooksco tenant not found")
    tenant_id=tenant[0]

    imported=updated=skipped=0
    with CSV.open(newline="", encoding="utf-8-sig") as f:
        reader=csv.DictReader(f)
        for r in reader:
            name=(r.get("full_name") or r.get("name") or "").strip()
            phone=(r.get("phone") or "").strip()
            email=(r.get("email") or "").strip() or None
            np=norm_phone(phone)
            nn=norm_name(name)

            if not name and not np and not email:
                skipped+=1
                continue

            existing=None
            if np:
                existing=conn.execute("""
                    SELECT id FROM tenant_customers
                    WHERE tenant_id=%s AND normalized_phone=%s
                    LIMIT 1
                """,(tenant_id,np)).fetchone()

            if existing:
                conn.execute("""
                    UPDATE tenant_customers
                    SET display_name=COALESCE(NULLIF(%s,''),display_name),
                        normalized_name=COALESCE(NULLIF(%s,''),normalized_name),
                        phone=COALESCE(NULLIF(%s,''),phone),
                        email=COALESCE(%s,email),
                        source='whatsapp_group_import',
                        updated_at=now()
                    WHERE id=%s
                """,(name,nn,phone,email,existing[0]))
                updated+=1
            else:
                conn.execute("""
                    INSERT INTO tenant_customers
                    (id,tenant_id,display_name,normalized_name,phone,normalized_phone,email,source,metadata)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,'whatsapp_group_import',%s::jsonb)
                """,(uuid.uuid4(),tenant_id,name or phone or email,nn,phone,np,email,'{"import":"amooksco_whatsapp"}'))
                imported+=1

    conn.commit()
    print({"imported": imported, "updated": updated, "skipped": skipped})
