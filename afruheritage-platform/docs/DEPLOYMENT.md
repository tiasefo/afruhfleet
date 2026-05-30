# Deployment guide

## 1. Required infrastructure

### Control plane host
Use a dedicated Linux host or VM for the Afruheritage control plane with:
- Docker Engine
- Docker Compose plugin
- DNS for the control-plane API and any future admin UI
- Firewall rules allowing HTTPS and SSH only from approved networks

### Runner nodes
Each production tenant should be deployed to a dedicated Linux VM or host. This repository assumes one Fleetbase runtime per runner node to avoid cross-tenant leakage and host-port conflicts created by repeated CLI-generated Docker stacks.

Minimum baseline per runner:
- Ubuntu 22.04 or 24.04 LTS
- 4 vCPU minimum
- 8 GB RAM minimum
- 80+ GB SSD
- Public or routed private IP with managed DNS
- Docker Engine and Docker Compose plugin
- Node.js and npm
- Fleetbase CLI installed globally
- SSH access from the Afruheritage control plane

## 2. Why the runner prerequisites matter

This platform provisions Fleetbase using the official Fleetbase CLI on the target runner node. The provisioning job executes:

```bash
flb install-fleetbase --host 0.0.0.0 --environment production --directory /opt/afruheritage/tenants/<tenant-slug>
```

That command is embedded in `app/services/fleetbase_provisioner.py` and is the required installation path for this repository.

## 3. Bootstrap the control plane

```bash
cp .env.example .env
mkdir -p secrets
chmod 700 secrets
# place your private key at secrets/runner_key or update RUNNER_DEFAULT_SSH_KEY_PATH
docker compose up --build -d
```

Create the first admin:

```bash
make bootstrap-admin
```

## 4. Bootstrap a runner node

Run the included bootstrap script on each runner:

```bash
scp scripts/bootstrap_runner.sh ubuntu@runner-01:/tmp/bootstrap_runner.sh
ssh ubuntu@runner-01 'chmod +x /tmp/bootstrap_runner.sh && sudo /tmp/bootstrap_runner.sh'
```

The script installs Docker, Docker Compose plugin, Node.js LTS, npm, and the Fleetbase CLI package.

## 5. Register a runner node

Use the admin token from bootstrap or login, then register a runner:

```bash
curl -X POST http://localhost:8100/api/v1/runners \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "runner-01",
    "host": "10.0.10.21",
    "ssh_port": 22,
    "ssh_user": "ubuntu",
    "fleetbase_root": "/opt/afruheritage/tenants",
    "reserved_for_single_tenant": true
  }'
```

## 6. Tenant onboarding and launch

Create tenant:

```bash
curl -X POST http://localhost:8100/api/v1/tenants \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "company_name": "Blue Atlas Freight",
    "contact_email": "ops@blueatlas.example",
    "plan_code": "growth",
    "requested_domain": "blueatlas.afruheritage.example.com",
    "domain_type": "provider_subdomain",
    "verification_notes": "KYC docs validated manually by operations"
  }'
```

Approve tenant:

```bash
curl -X POST http://localhost:8100/api/v1/tenants/<TENANT_ID>/approve \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"verification_notes": "Approved for provisioning"}'
```

Launch tenant:

```bash
curl -X POST http://localhost:8100/api/v1/tenants/<TENANT_ID>/launch \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"runner_id": "<RUNNER_ID>"}'
```

Check job status:

```bash
curl -H 'Authorization: Bearer <TOKEN>' http://localhost:8100/api/v1/tenants/jobs/<JOB_ID>
```

## 7. White-label and routing requirements

This repository enforces Afruheritage as the visible brand, but Fleetbase console asset rebranding may still require commercial-license-safe customization of the Fleetbase console build and mail templates. Use `docs/FLEETBASE_WHITELABEL.md` before exposing any tenant runtime publicly.

Do not expose raw Fleetbase hostnames or admin URLs to tenants. Route access through Afruheritage-controlled domains and managed TLS.

## 8. Production hardening checklist

- Disable `ENABLE_BOOTSTRAP_ADMIN` after first admin creation
- Put the API behind HTTPS only
- Restrict runner SSH access by IP
- Rotate runner SSH keys regularly
- Send logs to centralized observability
- Add DB migrations before production change management
- Add domain verification workflows before enabling customer-owned domains
- Add billing gates before tenant launch in commercial use
